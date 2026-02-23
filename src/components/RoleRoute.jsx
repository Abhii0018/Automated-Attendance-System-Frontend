import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { ROLE_REDIRECTS } from "../utils/constants";

const RoleRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    const redirect = ROLE_REDIRECTS[user?.role] || "/login";
    return <Navigate to={redirect} replace />;
  }

  return children;
};

export default RoleRoute;