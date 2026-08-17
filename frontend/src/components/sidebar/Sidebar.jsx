import { useState } from "react";
import Conversations from "./Conversations";
import LogoutButton from "./LogoutButton";
import ProfileModal from "./ProfileModal";
import SearchInput from "./SearchInput";
import { useAuthContext } from "../../context/AuthContext";

const Sidebar = () => {
  const [profileOpen, setProfileOpen] = useState(false);
  const { authUser } = useAuthContext();

  return (
    <div className="border-r border-slate-500 p-4 flex flex-col">
      <SearchInput />
      <div className="divider px-3"></div>
      <Conversations />

      {/* my profile — click to view / edit */}
      <div
        className="mt-auto flex items-center gap-3 mb-3 p-2 rounded-lg cursor-pointer hover:bg-slate-800"
        onClick={() => setProfileOpen(true)}
      >
        <div className="avatar">
          <div className="w-9 rounded-full">
            <img src={authUser?.profilePic} alt="me" />
          </div>
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="text-sm font-bold text-white truncate">{authUser?.fullName}</span>
          <span className="text-xs text-gray-400 truncate">@{authUser?.username}</span>
        </div>
      </div>

      <LogoutButton />
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
};
export default Sidebar;
