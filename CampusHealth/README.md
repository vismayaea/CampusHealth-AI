# Campus Mental Health Platform

A comprehensive digital mental health and psychological support system designed specifically for Indian higher education institutions. This platform provides stigma-free support, ensures early intervention, and enables data-driven action for student mental health.

## 🌟 Features

### Core Functionality
- **AI-Guided Coping Chatbot**: Intelligent, interactive chat assisting students with self-help strategies based on psychological first-aid and screening (PHQ-9, GAD-7)
- **Confidential Appointment System**: Private booking for sessions with campus counsellors and helplines
- **Resource Library**: Videos, articles, and relaxation resources in multiple regional languages for psychoeducation and self-care
- **Peer Support Forum**: Secure, moderated space for students to discuss issues with trained peer supporters
- **Admin Analytics Dashboard**: De-identified analytics for trends, risks, and intervention planning

### Indian-Specific Features
- **Regionalization**: Content and support available in vernacular languages (Hindi, Tamil, Telugu, Bengali, Gujarati, Kannada, Malayalam, Marathi, Punjabi, Urdu)
- **Institutional Customization**: System maps to local counsellors, helplines, and support resources
- **Offline Support Integration**: Facilitates escalation to in-person college counselling
- **Cultural Context**: Content reflects Indian socio-cultural realities

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd campus-mental-health-platform
   ```

2. **Install server dependencies**
   ```bash
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   MONGODB_URI=mongodb://localhost:27017/campus-mental-health
   JWT_SECRET=your-super-secret-jwt-key-here
   PORT=5000
   NODE_ENV=development
   CLIENT_URL=http://localhost:3000
   OPENAI_API_KEY=your-openai-api-key-here
   ```

5. **Start the development servers**
   
   Terminal 1 (Backend):
   ```bash
   npm run dev
   ```
   
   Terminal 2 (Frontend):
   ```bash
   npm run client
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 📁 Project Structure

```
campus-mental-health-platform/
├── client/                 # React frontend application
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── contexts/      # React contexts (Auth, Language, Theme)
│   │   ├── pages/         # Page components
│   │   ├── services/      # API service functions
│   │   └── utils/         # Utility functions
│   └── package.json
├── models/                # MongoDB models
├── routes/                # Express.js routes
├── middleware/            # Custom middleware
├── server.js             # Main server file
├── package.json          # Server dependencies
└── README.md
```

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Socket.io** - Real-time communication
- **OpenAI API** - AI chatbot integration

### Frontend
- **React 18** - UI library
- **React Router** - Client-side routing
- **React Query** - Data fetching and caching
- **React Hook Form** - Form handling
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Lucide React** - Icons
- **Recharts** - Data visualization

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### Chatbot
- `POST /api/chatbot/start-session` - Start chat session
- `POST /api/chatbot/message` - Send message
- `GET /api/chatbot/session/:id` - Get session history
- `POST /api/chatbot/end-session` - End session

### Screening
- `GET /api/screening/questionnaires` - Get available questionnaires
- `GET /api/screening/questionnaire/:type` - Get questionnaire questions
- `POST /api/screening/submit` - Submit screening responses
- `GET /api/screening/history` - Get user's screening history

### Appointments
- `GET /api/appointments/counselors` - Get available counselors
- `GET /api/appointments/counselor/:id/availability` - Get counselor availability
- `POST /api/appointments/book` - Book appointment
- `GET /api/appointments/my-appointments` - Get user's appointments

### Resources
- `GET /api/resources` - Get resources with filtering
- `GET /api/resources/:id` - Get specific resource
- `POST /api/resources/:id/rate` - Rate resource
- `GET /api/resources/categories/list` - Get resource categories

### Forum
- `GET /api/forum/posts` - Get forum posts
- `POST /api/forum/posts` - Create forum post
- `POST /api/forum/posts/:id/comments` - Add comment
- `POST /api/forum/posts/:id/like` - Like post

### Admin
- `GET /api/admin/dashboard/overview` - Get dashboard overview
- `GET /api/admin/analytics/*` - Get various analytics
- `GET /api/admin/reports/generate` - Generate reports

## 🌐 Multi-Language Support

The platform supports 11 Indian languages:
- English (en)
- Hindi (hi)
- Tamil (ta)
- Telugu (te)
- Bengali (bn)
- Gujarati (gu)
- Kannada (kn)
- Malayalam (ml)
- Marathi (mr)
- Punjabi (pa)
- Urdu (ur)

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS protection
- Helmet.js security headers
- Privacy-preserving analytics

## 📊 Analytics & Reporting

### Admin Dashboard
- User engagement metrics
- Mental health trends
- Resource usage statistics
- System health monitoring
- Custom report generation

### Privacy-Preserving Analytics
- De-identified data collection
- Anonymized user metrics
- Aggregate trend analysis
- No personal information in reports

## 🚀 Deployment

### Production Build
```bash
# Build client
cd client
npm run build
cd ..

# Start production server
npm start
```

### Environment Variables for Production
```env
NODE_ENV=production
MONGODB_URI=mongodb://your-production-db
JWT_SECRET=your-production-jwt-secret
CLIENT_URL=https://your-domain.com
OPENAI_API_KEY=your-openai-key
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🎯 Roadmap

- [ ] Mobile app development
- [ ] Advanced AI features
- [ ] Integration with more universities
- [ ] Telehealth video consultations
- [ ] Advanced analytics dashboard
- [ ] Mobile push notifications
- [ ] Offline mode support

## 🙏 Acknowledgments

- Indian mental health professionals for guidance
- University partners for feedback
- Open source community for tools and libraries
- Students who provided valuable insights

---

**Note**: This platform is designed specifically for Indian higher education institutions and includes culturally appropriate content and support mechanisms. Always ensure compliance with local data protection and healthcare regulations.
