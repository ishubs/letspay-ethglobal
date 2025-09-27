import { Link } from "react-router-dom";
import { useLetsPay } from "../lib/useLetsPay";
import { Button } from "@/components/ui/button";
import { LogOutIcon } from "lucide-react";

export default function Navbar() {
  const { isConnected } = useLetsPay();

  const handleLogout = () => {
    window.location.reload();
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <Link to="/" className="text-2xl !font-bold text-gray-900" aria-label="LetsPay Home">
              LetsPay
            </Link>
          </div>
          {isConnected && (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Connected</span>
              </div>
              <Button
                onClick={handleLogout}
                // className="p-2 rounded hover:bg-gray-100 text-gray-600"
                // title="Logout"
                variant="ghost"
                className="!bg-transparent"
                // aria-label="Logout"
              >
                
               <LogOutIcon />
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}


