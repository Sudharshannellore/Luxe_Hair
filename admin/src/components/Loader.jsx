import React from "react";
import { Loader2 } from "lucide-react";

const Loader = () => {
  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
      <Loader2 className="animate-spin text-amber-600" size={50} />
    </div>
  );
};

export default Loader;
