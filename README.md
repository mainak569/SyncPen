# ✍️ SyncPen – Where Sync Meets Pen

**SyncPen** is a powerful, real-time productivity tool that combines the functionality of a **Notion-style text editor**, an **Excalidraw-like whiteboard**, and an **AI-powered assistant** – all in one place.

> ✅ Plan • ✏️ Draw • 📄 Write • 💬 Ask AI • 🔄 Sync – all in one place.

---

## 🚀 Live Demo

🌐 [Check out SyncPen Live](https://sync-pen-six.vercel.app/)

---

## ✨ Features

### 📝 Document Editor
- Real-time Notion-style text editor
- Infinite nested (children) documents
- Icons and cover images for each document
- Publish docs to the web
- Soft delete + Trash bin + Recovery
- Light and Dark mode toggle
- Mobile responsive layout

### 🎨 Whiteboard
- Excalidraw-inspired infinite canvas
- 30+ drawing features (shapes, arrows, freehand, etc.)
- Sync notes and visuals seamlessly

### 🤖 Page-aware Chatbot
- Ask AI questions about your current document context
- Smart replies and inline suggestions

### 📁 File Handling
- Upload, delete, and replace files
- Attach media directly to documents

### 🌲 UI/UX & Navigation
- Collapsible and expandable sidebar
- Smooth animations and transitions
- Intuitive document hierarchy
- Fully responsive on mobile, tablet, and desktop

---

## 🛠️ Tech Stack

| Tech            | Purpose                        |
|-----------------|--------------------------------|
| **Next.js**     | Frontend framework             |
| **Convex**      | Real-time backend              |
| **Edgestore**   | File storage                   |
| **TailwindCSS** | Styling                        |
| **ShadCN/UI**   | Component library              |
| **Clerk**       | Authentication                 |
| **Gemini**      | AI assistant integration       |
| **Vercel**      | Hosting & deployment           |

---

## 📦 Getting Started

1. **Clone the repo**
   ```bash
   git clone https://github.com/mainak569/SyncPen.git
   cd SyncPen
   ```
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Configure `.env` file**
   ```env
    # Convex (Real-time Backend)
    CONVEX_DEPLOYMENT=dev:elegant-dsdjnwlqjdnflqwsd-219
    NEXT_PUBLIC_CONVEX_URL=https://fjwdnfj-lemming-219.convex.cloud
    
    # Clerk (Authentication)
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=dsdsdjcwnlfjwlf
    CLERK_SECRET_KEY=dswfnjkwneflkwmfpklewmlfm
    
    # Edgestore (File Uploads)
    EDGE_STORE_ACCESS_KEY=dsddsdsdsdfwnfjkwe
    EDGE_STORE_SECRET_KEY=dsdddsdsdsdsfnewlkfm
    
    # Google API (if used for integration like Calendar, Docs, etc.)
    GOOGLE_API_KEY=fdjsnfjkndwiofmwofnwekjnfkw
   ```
4. **Run the dev server**
   ```bash
   npm run dev
   ```

### 🙋‍♂️ About Me

Hi! I’m **Mainak Das** 👋  
I’m passionate about building tools that empower people to think, plan, and create more effectively.  
Feel free to connect with me on [LinkedIn](https://www.linkedin.com/in/mainak-das-93b787287/).
