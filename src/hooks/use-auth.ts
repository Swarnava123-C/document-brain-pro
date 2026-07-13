import { useUser, useAuth as useClerkAuth } from "@clerk/clerk-react";

export function useAuth() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { isLoaded: isAuthLoaded } = useClerkAuth();

  const fallbackUser = {
    id: "demo-user-123",
    fullName: "Swarnava Lead Engineer",
    firstName: "Swarnava",
    lastName: "Lead Engineer",
    primaryEmailAddress: { emailAddress: "swarnava@industrialmind.ai" },
    imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  };

  const activeUser = user ? { ...user, id: user.id } : fallbackUser;
  const activeUserId = user ? user.id : "demo-user-123";

  return { 
    session: null,
    user: activeUser,
    userId: activeUserId,
    loading: !isUserLoaded || !isAuthLoaded 
  };
}
