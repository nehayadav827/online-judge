import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const ProtectedRoute = ({
  children,
}) => {
  const {
    user,
    loading,
  } = useAuthStore();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return (
      <Navigate to="/login" />
    );
  }

  return children;
};

export default ProtectedRoute;