"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, LucideIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
import { Item } from "../app/(main)/(notes)/_components/item"; // Import Item component

export function AppearanceToggler() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [currentTheme, setCurrentTheme] = useState(theme);

  useEffect(() => {
    setCurrentTheme(theme === "system" ? systemTheme : theme);
  }, [theme, systemTheme]);

  const Icon = currentTheme === "dark" ? Moon : Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div>
          <Item label="Appearance" icon={Icon} onClick={() => {}} />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
