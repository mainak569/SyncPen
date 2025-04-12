"use client";

import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Item } from "./item";
import { cn } from "@/lib/utils";
import { Presentation } from "lucide-react";

interface BoardListProps {
  parentBoardId?: Id<"boards">;
  level?: number;
  data?: Doc<"boards">;
}
const BoardList = ({ parentBoardId, level = 0 }: BoardListProps) => {
  const params = useParams();
  const router = useRouter();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const onExpand = (boardId: string) => {
    setExpanded((prevExpanded) => ({
      ...prevExpanded,
      [boardId]: !prevExpanded[boardId],
    }));
  };

  // Fetches boards from Convex
  const boards = useQuery(api.boards.getSidebar, {
    parentBoard: parentBoardId,
  });

  // When a board is clicked
  const onRedirect = (boardId: string) => {
    router.push(`/boards/${boardId}`);
  };

  // If boards is undefined (loading state), it renders skeleton placeholders
  if (boards === undefined) {
    return (
      <>
        <Item.Skeleton level={level} />
        {level === 0 && (
          <>
            <Item.Skeleton level={level} />
            <Item.Skeleton level={level} />
          </>
        )}
      </>
    );
  }
  return (
    <>
      <p
        style={{
          paddingLeft: level ? `${level * 12 + 25}px` : undefined,
        }}
        className={cn(
          "hidden text-sm font-medium text-muted-foreground/80",
          expanded && "last:block",
          level === 0 && "hidden"
        )}
      >
        No boards inside
      </p>
      {boards.map((board) => (
        <div key={board._id}>
          <Item
            id={board._id}
            onClick={() => onRedirect(board._id)}
            label={board.title}
            icon={Presentation}
            // boardIcon={board.icon}
            active={params.boardId === board._id}
            level={level}
            onExpand={() => onExpand(board._id)}
            expanded={expanded[board._id]}
          />
          {/* recursively rendering sub-boards (child boards)
          inside a board list when the board is expanded */}
          {expanded[board._id] && (
            <BoardList parentBoardId={board._id} level={level + 1} />
          )}
        </div>
      ))}
    </>
  );
};

export default BoardList;
