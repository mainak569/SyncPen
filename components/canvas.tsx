"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Excalidraw, MainMenu, WelcomeScreen } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { useTheme } from "next-themes";
import Logo from "@/components/logo";
import { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";

interface CanvasProps {
  initialContent?: string;
  onSaveContent: (content: string) => void;
  editable?: boolean;
}

// Excalidraw fires onChange on every pointer move; without this each one
// would be a full board write to the database.
const SAVE_DELAY_MS = 500;

const Canvas: React.FC<CanvasProps> = ({
  initialContent,
  onSaveContent,
  editable = true,
}) => {
  const { theme } = useTheme();

  const [excalidrawAPI, setExcalidrawAPI] =
    useState<ExcalidrawImperativeAPI | null>(null);

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

  // Kept in a ref so the debounce timer is not reset every render just because
  // the parent passes a fresh onSaveContent closure.
  const onSaveContentRef = useRef(onSaveContent);
  useEffect(() => {
    onSaveContentRef.current = onSaveContent;
  }, [onSaveContent]);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleChange = useCallback(
    (elements: readonly ExcalidrawElement[]) => {
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

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        onSaveContentRef.current(content);
      }, SAVE_DELAY_MS);
    },
    [editable, excalidrawAPI]
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
