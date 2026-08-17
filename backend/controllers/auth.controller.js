import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import generateTokenAndSetCookie from "../utils/generateToken.js";

export const signup = async (req, res) => {
	try {
		const { fullName, username, password, confirmPassword, gender } = req.body;

		if (password !== confirmPassword) {
			return res.status(400).json({ error: "Passwords don't match" });
		}

		const user = await User.findOne({ username });

		if (user) {
			return res.status(400).json({ error: "Username already exists" });
		}

		// HASH PASSWORD HERE
		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);

		// https://www.dicebear.com/styles/ — generates a deterministic SVG avatar
		// from the seed (same username = same avatar, nothing stored by us).
		// Style is swappable: adventurer, avataaars, bottts, lorelei, notionists...
		const profilePic = `https://api.dicebear.com/9.x/adventurer/svg?seed=${username}`;

		const newUser = new User({
			fullName,
			username,
			password: hashedPassword,
			gender,
			profilePic,
		});

		if (newUser) {
			// Generate JWT token here
			generateTokenAndSetCookie(newUser._id, res);
			await newUser.save();

			res.status(201).json({
				_id: newUser._id,
				fullName: newUser.fullName,
				username: newUser.username,
				profilePic: newUser.profilePic,
				gender: newUser.gender,
				createdAt: newUser.createdAt,
			});
		} else {
			res.status(400).json({ error: "Invalid user data" });
		}
	} catch (error) {
		console.log("Error in signup controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const login = async (req, res) => {
	try {
		const { username, password } = req.body;
		const user = await User.findOne({ username });
		const isPasswordCorrect = await bcrypt.compare(password, user?.password || "");

		if (!user || !isPasswordCorrect) {
			return res.status(400).json({ error: "Invalid username or password" });
		}

		generateTokenAndSetCookie(user._id, res);

		res.status(200).json({
			_id: user._id,
			fullName: user.fullName,
			username: user.username,
			profilePic: user.profilePic,
			gender: user.gender,
			createdAt: user.createdAt,
		});
	} catch (error) {
		console.log("Error in login controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const logout = (req, res) => {
	try {
		res.cookie("jwt", "", { maxAge: 0 });
		res.status(200).json({ message: "Logged out successfully" });
	} catch (error) {
		console.log("Error in logout controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

// PROFILE — "who am I right now?"
// protectRoute already verified the JWT cookie AND loaded the user
// document into req.user (minus password) — this controller just hands
// it back. This is middleware paying for itself: 3 lines, no DB query.
export const getMe = (req, res) => {
	res.status(200).json(req.user);
};

// PROFILE — update my details.
// The whitelist is the `updates` object below: we build it field by field
// from validated values, so anything else the client sent (password,
// profilePic, createdAt...) is simply never read.
export const updateUser = async (req, res) => {
	try {
		const fullName = (req.body.fullName || "").trim();
		const username = (req.body.username || "").trim();
		const gender = req.body.gender;

		if (!fullName || !username) {
			return res.status(400).json({ error: "Full name and username are required" });
		}
		if (!["male", "female"].includes(gender)) {
			return res.status(400).json({ error: "Invalid gender" });
		}

		const updates = { fullName, username, gender };

		// the avatar is DERIVED from the username (DiceBear seed) —
		// a changed username means a re-derived avatar
		if (username !== req.user.username) {
			updates.profilePic = `https://api.dicebear.com/9.x/adventurer/svg?seed=${username}`;
		}

		const updatedUser = await User.findByIdAndUpdate(
			req.user._id,
			{ $set: updates },
			{ new: true, runValidators: true }
		).select("-password");

		res.status(200).json(updatedUser);
	} catch (error) {
		// E11000 = the unique index on `username` rejected a duplicate.
		// The index is the REAL referee — a "check first, then write"
		// always has a race window where two requests can both pass the check
		if (error.code === 11000) {
			return res.status(400).json({ error: "Username already exists" });
		}
		console.log("Error in updateUser controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};
