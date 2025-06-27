🏡 HevanCraft is a beautifully crafted e-commerce website focused on home decor products, built using Node.js, Express, EJS, and MongoDB.
The platform allows users to browse, view, and manage decor items with a clean and responsive user interface.
Designed with aesthetics and performance in mind, HevanCraft provides a smooth shopping experience for customers interested in enhancing their living spaces.


🛠️ Tech Stack

Frontend: HTML, CSS, EJS (Embedded JavaScript)
Backend: Node.js, Express.js
Database: MongoDB (using Mongoose)
Templating Engine: EJS


🚀 Features
1. Product listing with images, prices, and descriptions
2. View detailed product pages
3.Admin-side functionality to add, edit, or delete products
4. EJS-based server-side rendering for dynamic content
5. MongoDB database for storing product data
6. RESTful API routes
7. Clean and modern UI with responsive design


📁 Folder Structure
HevanCraft/
│
├── public/           # Static files (CSS, JS, images)
├── views/            # EJS templates
│   ├── partials/     # Header, footer, etc.
│   └── pages/        # Main pages
├── models/           # Mongoose schemas
├── routes/           # Route handlers
├── .env              # Environment variables (e.g., DB_URI)
├── app.js            # Main server file
└── package.json      # Project metadata and dependencies


🔧 Installation & Setup
1. Clone the repository
git clone https://github.com/your-username/hevancraft.git
cd hevancraft

2. Install dependencies
npm install

3. Create a .env file
DB_URI=your-mongodb-connection-string
PORT=3000

4. Run the app
npm start

5.Open in browser
http://localhost:3000
