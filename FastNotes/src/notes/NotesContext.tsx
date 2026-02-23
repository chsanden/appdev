import React, { createContext, useContext, useMemo, useState } from "react";

export type Note =
{
    id: string;
    title: string;
    content: string;
};

type NotesContextValue =
{
    notes: Note[];
    addNote: (title: string, content: string) => void;
};

const NotesContext = createContext<NotesContextValue | undefined>(undefined);

export function NotesProvider({ children }: { children: React.ReactNode })
{
    const [notes, setNotes] = useState<Note[]>
    ([
        { id: "1", title: "Second Note", content: "Follow up note - also hard coded" },
        { id: "2", title: "First Note", content: "This is the first note currently hard coded" }
    ]);

    const addNote = (title: string, content: string) =>
    {
        const newNote: Note =
        { 
            id: Date.now().toString(),
            title: title.trim() || "(Untitled)",
            content: content.trim()
        };
      setNotes((prev) => [newNote, ...prev])  
    };

    const value = useMemo(() => ({ notes, addNote }), [notes]);

    return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}

export function useNotes()
{
    const ctx = useContext(NotesContext);
    if(!ctx) throw new Error("useNotes must be used inside NotesProvider");
    return ctx;
}