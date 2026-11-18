<body>

  <h1>💇‍♀️ Luxe Hair — Hair Clinic Application</h1>

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
  <pre><code>cd server &amp;&amp; npm install
cd ../client &amp;&amp; npm install
cd ../admin &amp;&amp; npm install</code></pre>

  <h4>3️⃣ Environment Variables</h4>
  <p>Each app has a <code>.env.example</code>. Copy it to <code>.env</code> and fill in the values. <code>.env</code> files are git-ignored.</p>
  <table>
    <tr><th>File</th><th>Key settings</th></tr>
    <tr><td><code>server/.env</code></td><td><code>MONGO_URL</code>, <code>JWT_SECRET</code>, <code>EMAIL_USER</code>/<code>EMAIL_PASS</code>, <code>CLIENT_URLS</code> (allowed frontend origins for CORS), optional <code>CLOUDINARY_CLOUD_NAME</code> / <code>CLOUDINARY_API_KEY</code> / <code>CLOUDINARY_API_SECRET</code> (image hosting; images are saved in <code>server/uploads</code> when blank)</td></tr>
    <tr><td><code>client/.env</code></td><td><code>VITE_API_URL</code></td></tr>
    <tr><td><code>admin/.env</code></td><td><code>VITE_API_URL</code>, <code>VITE_SITE_URL</code></td></tr>
  </table>
  <p><strong>Production:</strong> set <code>CLIENT_URLS</code> to your deployed client and admin URLs (comma-separated), otherwise the browser requests are blocked by CORS.</p>

  <h4>4️⃣ Run the Application</h4>
  <pre><code>cd server &amp;&amp; npm run dev    # API on http://localhost:5000
cd client &amp;&amp; npm run dev    # site on http://localhost:5173
cd admin  &amp;&amp; npm run dev    # admin on http://localhost:5174</code></pre>

  <h4>5️⃣ Payments</h4>
  <ul>
    <li><strong>Pay at salon</strong> works out of the box.</li>
    <li><strong>Pay online</strong> is a <strong>demo checkout</strong> for showcasing: an animated card / UPI form with a simulated processing step. No payment gateway is connected and no money is charged. Use any card number (e.g. 4242 4242 4242 4242), any future expiry and any 3-digit CVV, or any UPI ID like <code>name@okbank</code>. Card numbers are never sent to the server. Unfinished checkouts are released after 30 minutes.</li>
  </ul>

  <h4>6️⃣ Security notes</h4>
  <ul>
    <li><strong>Showcase mode:</strong> the admin panel has no login and admin endpoints are open, so anyone with the URL can change data. Re-run <code>npm run seed</code> to restore demo data.</li>
    <li>Prices and coupon discounts are always computed on the server.</li>
    <li>Requests are validated with zod, rate-limited, and served with Helmet security headers.</li>
  </ul>

  <h2>💌 Email Notifications</h2>
  <ul>
    <li><strong>Appointment & Combo Reminders:</strong> Sent automatically before scheduled time</li>
    <li><strong>Payment Status Emails:</strong> Sent for successful or failed online payments</li>
    <li>Powered by <strong>Nodemailer</strong></li>
  </ul>

  <h2>📊 Dashboard Highlights</h2>
  <ul>
    <li>Monthly revenue chart (services vs combos), booking status breakdown, top services and today's schedule</li>
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
