import React from "react";
import * as Icons from "lucide-react";

export default function LucideIcon({ name, className = "", size = 20 }) {
  // Fallback to Flame if icon is not found
  const IconComponent = Icons[name] || Icons.Flame;
  return <IconComponent className={className} size={size} />;
}
