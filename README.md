<body>

  <h1>💇‍♀️ Luxe Hair — Hair Clinic Management Application</h1>

  <p><strong>Luxe Hair</strong> is a full-stack <strong>MERN (MongoDB, Express.js, React.js, Node.js)</strong> web application built for modern hair clinics. It provides a seamless experience for clients to <strong>book appointments, purchase combo services, and make payments (COD or Online)</strong>, while enabling admins to <strong>manage services, staff, offers, bookings, and analytics</strong> — all in one place.</p>

  <h2>🧠 Features</h2>

  <h3>👩‍💼 Client Side</h3>
  <ul>
    <li>Browse <strong>services</strong>, <strong>combo services</strong>, and <strong>special offers</strong></li>
    <li>Book <strong>appointments</strong> or <strong>combo packages</strong></li>
    <li>Choose <strong>Cash on Delivery (COD)</strong> or <strong>Online Payment (Dummy Gateway)</strong></li>
    <li>Receive <strong>email reminders</strong> for appointments and combos</li>
    <li>Get <strong>payment status updates</strong> via email (success/failure)</li>
    <li>Manage profile and booking history</li>
    <li>Explore <strong>articles</strong> and contact the clinic</li>
  </ul>

  <h3>🧑‍💻 Admin Side</h3>
  <ul>
    <li>Manage <strong>Services, Combos, Bookings, and Combo Orders</strong></li>
    <li>Manage <strong>Staff</strong> — add/edit staff and assign to bookings</li>
    <li>Manage <strong>Offers</strong> — create or delete offers</li>
    <li>Set <strong>Payment Methods</strong> — enable/disable COD or online</li>
    <li>Track <strong>Email Notifications</strong> (reminders and payment updates)</li>
    <li>Manage <strong>Reviews</strong> from users</li>
    <li>Dashboard Analytics:
      <ul>
        <li>Total Bookings & Combo Orders</li>
        <li>Total Revenue & This Month’s Revenue</li>
        <li>Monthly Revenue <strong>Line Chart</strong></li>
      </ul>
    </li>
  </ul>

  <h2>🧩 Tech Stack</h2>
  <table>
    <tr>
      <th>Layer</th>
      <th>Technology</th>
    </tr>
    <tr><td>Frontend</td><td>React.js, React Router, Tailwind CSS</td></tr>
    <tr><td>Backend</td><td>Node.js, Express.js</td></tr>
    <tr><td>Database</td><td>MongoDB (Mongoose ORM)</td></tr>
    <tr><td>Email Service</td><td>Nodemailer</td></tr>
    <tr><td>Charts</td><td>Recharts</td></tr>
    <tr><td>Icons</td><td>Lucide React</td></tr>
    <tr><td>Authentication</td><td>JWT (JSON Web Tokens)</td></tr>
  </table>

  <h2>⚙️ Installation & Setup</h2>

  <h4>1️⃣ Clone the Repository</h4>
  <pre><code>git clone https://github.com/Sudharshannellore/Luxe_Hair.git
cd luxe-hair</code></pre>

  <h4>2️⃣ Install Dependencies</h4>
  <pre><code># Backend
cd server
npm install

# Frontend
cd client
npm install</code></pre>

  <h4>3️⃣ Setup Environment Variables (Backend)</h4>
  <pre><code>MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
PORT=5000
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_app_password</code></pre>

  <h4>4️⃣ Setup Environment Variables (Client/Admin)</h4>
  <pre><code>VITE_API_URL=http://localhost:5000</code></pre>

  <h4>5️⃣ Run the Application</h4>
  <pre><code># Start backend
cd server
npm run dev

# Start frontend
cd client   # or cd admin
npm run dev</code></pre>

  <h2>💌 Email Notifications</h2>
  <ul>
    <li><strong>Appointment & Combo Reminders:</strong> Sent automatically before scheduled time</li>
    <li><strong>Payment Status Emails:</strong> Sent for successful or failed online payments</li>
    <li>Powered by <strong>Nodemailer</strong></li>
  </ul>

  <h2>📊 Dashboard Highlights</h2>
  <ul>
    <li>Interactive <strong>monthly revenue line chart</strong></li>
    <li>Real-time analytics for bookings and orders</li>
    <li>Track <strong>staff performance</strong>, <strong>offers</strong>, and <strong>user reviews</strong></li>
  </ul>

  <h2>🙌 Author</h2>
  <p>
    <strong>Developed by:</strong> Sudharshan Rao Nellore<br>
    📧 Email: <a href="mailto:sudharshannellore@gmail.com">sudharshannellore@gmail.com</a><br>
    🐙 GitHub: <a href="https://github.com/Sudharshannellore" target="_blank">github.com/Sudharshannellore</a>
  </p>

  <h2>🪄 Future Enhancements</h2>
  <ul>
    <li>Integrate <strong>Razorpay / Stripe</strong> for real payments</li>
    <li>Add <strong>SMS notifications</strong> for reminders</li>
    <li>Enhance analytics (daily reports, retention tracking)</li>
  </ul>

  <h2>🌐 Live Links</h2>
  <p>
    Admin: <a href="https://adminluxehair.vercel.app" target="_blank">https://adminluxehair.vercel.app</a><br>
    Client: <a href="https://luxehair-ruby.vercel.app/" target="_blank">https://luxehair-ruby.vercel.app/</a>
  </p>

  <footer>© 2025 Luxe Hair | Built with ❤️ using MERN Stack</footer>
</body>
