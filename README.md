Notepad App
A lightweight, fully offline notepad application. No internet connection, server, or installation required.

How to Run
Download the notepad-app folder to your computer
Double-click index.html to open it in your browser
Start taking notes!
Folder Structure
notepad-app/
├── index.html        # Main entry point — open this to launch the app
├── css/
│   └── style.css     # All visual styles
├── js/
│   └── app.js        # All application logic
├── data/
│   └── notes.json    # Default empty notes structure (for reference)
└── README.md         # This file
Features
Create notes with a title and multi-line content
Edit notes — changes save automatically as you type
Delete notes with a confirmation prompt
Search notes by title or content in real time
Export all notes to a notes.json file on your computer
Import notes from a previously exported notes.json file
Notes persist across sessions using your browser's localStorage
Notes Data Format
When you export, the file follows this exact structure:

{
  "notes": [
    {
      "id": "unique-id",
      "title": "Note title",
      "content": "Full note text",
      "created_at": "2024-01-01T12:00:00.000Z",
      "updated_at": "2024-01-01T12:00:00.000Z"
    }
  ]
}
Requirements
Any modern browser (Chrome, Firefox, Safari, Edge)
No internet connection needed
No installation or setup required