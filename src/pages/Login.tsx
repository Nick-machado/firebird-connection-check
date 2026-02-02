import { useState } from "react";
import { SignIn1 } from "@/components/ui/modern-stunning-sign-in";

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);

  return (
    <SignIn1 
      isSignUp={isSignUp} 
      onToggleMode={() => setIsSignUp(!isSignUp)} 
    />
  );
};

export default Login;
