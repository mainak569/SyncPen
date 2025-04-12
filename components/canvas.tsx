"use client";

import React, { useCallback, useState } from "react";
import { Excalidraw, MainMenu, WelcomeScreen } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { useTheme } from "next-themes";
import Logo from "@/components/logo";

interface CanvasProps {
  initialContent?: string;
  onSaveContent: (content: string) => void;
  editable?: boolean;
}

const Canvas: React.FC<CanvasProps> = ({
  initialContent,
  onSaveContent,
  editable = true,
}) => {
  const { theme } = useTheme();

  const [excalidrawAPI, setExcalidrawAPI] = useState<any | null>(null);

  const parseInitialElements = useCallback(() => {
    try {
      const parsedContent = initialContent ? JSON.parse(initialContent) : {};
      if (Array.isArray(parsedContent.elements)) {
        return parsedContent.elements; // Return valid elements
      }
      // console.error("Invalid initialContent format:", parsedContent);
      return []; // Fallback to an empty array
    } catch (error) {
      console.error("Error parsing initialContent:", error);
      return []; // Fallback to an empty array
    }
  }, [initialContent]);

  const handleChange = useCallback(
    (elements: readonly any[]) => {
      if (!editable || !excalidrawAPI) return;

      // Get current app state for scroll position preservation
      const appState = excalidrawAPI.getAppState(); // Serialize and save content

      // Serialize and save content
      const content = JSON.stringify({
        elements,
        appState: {
          scrollX: appState.scrollX,
          scrollY: appState.scrollY,
          zoom: appState.zoom,
        },
      });

      onSaveContent(content);
    },
    [editable, excalidrawAPI, onSaveContent]
  );

  return (
    <div className="h-full w-full">
      <Excalidraw
        excalidrawAPI={(api) => setExcalidrawAPI(api)}
        initialData={{
          elements: parseInitialElements(),
          appState: {
            theme: theme === "dark" ? "dark" : "light",
          },
        }}
        onChange={handleChange}
        theme={theme === "dark" ? "dark" : "light"}
        UIOptions={{
          tools: {
            image: false,
          },
        }}
      >
        <MainMenu>
          <MainMenu.DefaultItems.ClearCanvas />
          <MainMenu.DefaultItems.SaveAsImage />
          <MainMenu.DefaultItems.ChangeCanvasBackground />
        </MainMenu>
        <WelcomeScreen>
          <WelcomeScreen.Hints.MenuHint />
          <WelcomeScreen.Hints.ToolbarHint />
          <WelcomeScreen.Center>
            <Logo />
            <WelcomeScreen.Center.Heading>
              Welcome to SyncPen !
            </WelcomeScreen.Center.Heading>
          </WelcomeScreen.Center>
        </WelcomeScreen>
      </Excalidraw>
    </div>
  );
};

export default Canvas;
