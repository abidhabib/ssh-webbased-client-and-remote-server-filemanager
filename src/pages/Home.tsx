import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useFileManagerStore } from "@/store/useFileManagerStore";

export default function Home() {
  const navigate = useNavigate();
  const { isConnected } = useFileManagerStore();

  useEffect(() => {
    if (isConnected) {
      navigate("/dashboard");
    } else {
      navigate("/");
    }
  }, [isConnected, navigate]);

  return null;
}
