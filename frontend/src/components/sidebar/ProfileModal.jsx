import { useState } from "react";
import toast from "react-hot-toast";
import { useAuthContext } from "../../context/AuthContext";

const ProfileModal = ({ open, onClose }) => {
	const { authUser, setAuthUser } = useAuthContext();
	const [isEditing, setIsEditing] = useState(false);
	const [fullName, setFullName] = useState("");
	const [username, setUsername] = useState("");
	const [gender, setGender] = useState("male");
	const [saving, setSaving] = useState(false);

	// re-seed the form from the CURRENT profile every time edit mode opens,
	// so a cancelled edit never leaks stale values into the next one
	const startEditing = () => {
		setFullName(authUser.fullName);
		setUsername(authUser.username);
		setGender(authUser.gender || "male");
		setIsEditing(true);
	};

	const handleSave = async (e) => {
		e.preventDefault();
		if (!fullName.trim() || !username.trim()) {
			toast.error("Full name and username are required");
			return;
		}
		setSaving(true);
		try {
			const res = await fetch("/api/auth/update", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ fullName, username, gender }),
			});
			const data = await res.json();
			// res.ok matters — fetch doesn't reject on 400/500 (Step 3 lesson)
			if (!res.ok || data.error) throw new Error(data.error || "Update failed");

			// keep the render cache AND React state in sync with server truth —
			// this is what makes the new name/avatar appear everywhere instantly
			localStorage.setItem("chat-user", JSON.stringify(data));
			setAuthUser(data);
			toast.success("Profile updated");
			setIsEditing(false);
		} catch (error) {
			toast.error(error.message);
		} finally {
			setSaving(false);
		}
	};

	if (!open || !authUser) return null;

	const memberSince = authUser.createdAt
		? new Date(authUser.createdAt).toLocaleDateString("en-IN", {
				day: "numeric",
				month: "long",
				year: "numeric",
			})
		: "—";

	return (
		<div className='modal modal-open' onClick={onClose}>
			{/* stopPropagation so clicks inside the box don't close the modal */}
			<div className='modal-box bg-slate-800 border border-slate-600' onClick={(e) => e.stopPropagation()}>
				{!isEditing ? (
					<>
						<div className='flex flex-col items-center gap-2 py-2'>
							<div className='avatar'>
								<div className='w-24 rounded-full border border-slate-600'>
									<img src={authUser.profilePic} alt='profile' />
								</div>
							</div>
							<h3 className='text-xl font-bold text-white'>{authUser.fullName}</h3>
							<p className='text-sm text-gray-400'>@{authUser.username}</p>
							<p className='text-xs text-gray-500 capitalize'>{authUser.gender}</p>
							<p className='text-xs text-gray-500'>Member since {memberSince}</p>
						</div>
						<div className='modal-action'>
							<button className='btn btn-sm' onClick={onClose}>
								Close
							</button>
							<button className='btn btn-sm btn-primary' onClick={startEditing}>
								Edit
							</button>
						</div>
					</>
				) : (
					<form onSubmit={handleSave}>
						<h3 className='text-xl font-bold text-white mb-2'>Edit profile</h3>

						<label className='label p-2'>
							<span className='text-base label-text'>Full Name</span>
						</label>
						<input
							type='text'
							className='w-full input input-bordered h-10 input-primary mb-2'
							value={fullName}
							onChange={(e) => setFullName(e.target.value)}
						/>

						<label className='label p-2'>
							<span className='text-base label-text'>Username</span>
						</label>
						<input
							type='text'
							className='w-full input input-bordered h-10 input-primary mb-2'
							value={username}
							onChange={(e) => setUsername(e.target.value)}
						/>

						<label className='label p-2'>
							<span className='text-base label-text'>Gender</span>
						</label>
						<select
							className='w-full select select-bordered h-10 mb-2'
							value={gender}
							onChange={(e) => setGender(e.target.value)}
						>
							<option value='male'>male</option>
							<option value='female'>female</option>
						</select>

						<div className='modal-action'>
							<button type='button' className='btn btn-sm' onClick={() => setIsEditing(false)}>
								Cancel
							</button>
							<button type='submit' className='btn btn-sm btn-primary' disabled={saving}>
								{saving ? <span className='loading loading-spinner loading-xs'></span> : "Save"}
							</button>
						</div>
					</form>
				)}
			</div>
		</div>
	);
};

export default ProfileModal;
