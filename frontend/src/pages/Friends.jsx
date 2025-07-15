import { useEffect, useState } from "react";
import { getUserFriends } from "../lib/api";  
import { Link } from "react-router-dom";

export default function Friends() {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFriends() {
      try {
        const data = await getUserFriends();
        setFriends(data);
      } catch (error) {
        console.error("Error fetching friends:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchFriends();
  }, []);

  if (loading) return <div className="p-4">Loading friends...</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Your Friends</h1>

      {friends.length === 0 ? (
        <p className="text-gray-500">You don’t have any friends yet.</p>
      ) : (
        <ul className="space-y-3">
          {friends.map((friend) => (
            <li
              key={friend._id}
              className="flex items-center justify-between bg-white p-3 rounded-lg shadow-md"
            >
              <div className="flex items-center gap-3">
                <img
                  src={friend.avatar || "/default-avatar.png"}
                  alt={friend.fullName}
                  className="w-10 h-10 rounded-full"
                />
                <span>{friend.fullName}</span>
              </div>
              <Link
                to={`/chat/${friend._id}`}
                className="text-blue-500 hover:underline"
              >
                Chat
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
