# CampusHealth AI

### AI-Powered Student Mental Wellness, Screening & Counselling Platform

CampusHealth AI is a full-stack student mental wellness platform designed to help educational institutions provide accessible, structured, and technology-assisted mental health support.

The platform combines AI-powered conversational support, validated mental-health screening, professional counselling appointments, wellness activities, educational resources, community discussions, notifications, and administrative analytics into one unified system.

---

## 🌱 Why CampusHealth AI?

Student mental health support is often fragmented across different services.

CampusHealth AI brings these capabilities together in one platform:

- 🧠 Mental health screening
- 🤖 AI-powered wellness chatbot
- 👩‍⚕️ Counsellor discovery and appointments
- 📅 Appointment management
- 🌿 Wellness activities
- 📚 Mental health resources
- 💬 Student community forum
- 🔔 Personalized notifications
- 📊 Administrative analytics
- 🔐 Role-based access control
- 🌐 Multi-language interface
- 🎨 Light, dark, and accessibility-focused themes

The goal is not to replace mental-health professionals, but to create an accessible first layer of support and connect students with appropriate resources and professional counselling.

---

# ✨ Key Features

## 🧠 Mental Health Screening

Students can complete structured mental-health assessments through the platform.

### Supported assessments

- PHQ-9
- GAD-7
- Structured questionnaire validation
- Score calculation
- Risk-level interpretation
- Screening history
- Completion tracking
- High-risk notification workflow

The backend validates:

- Required questions
- Question identifiers
- Missing questions
- Duplicate questions
- Unknown questions
- Extra questions
- Incomplete submissions

This prevents malformed or manipulated screening submissions.

---

## 🤖 AI Wellness Chatbot

CampusHealth AI includes an AI-powered conversational wellness assistant designed to provide supportive, non-diagnostic guidance.

Capabilities include:

- Conversational mental wellness support
- Guided responses
- Chat history
- Session management
- Supportive resource recommendations
- Escalation toward professional support when appropriate

The chatbot is designed as a support layer rather than a replacement for qualified professionals.

---

## 👩‍⚕️ Counsellor Management

Students can browse available counsellors and view their profiles.

Counsellor functionality includes:

- Counsellor profiles
- Specializations
- Availability
- Status
- Appointment booking
- Student appointment management
- Counsellor appointment dashboard

Counsellor accounts have restricted access to their assigned student appointments and related workflows.

---

## 📅 Appointment Management

The platform provides an end-to-end counselling appointment workflow.

### Appointment lifecycle

```text
Pending
   │
   ├── Approved ─── Completed
   │       │
   │       └────── Cancelled
   │
   ├── Rejected
   │
   └── Cancelled
