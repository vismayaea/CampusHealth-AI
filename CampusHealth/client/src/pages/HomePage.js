import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bot,
  Brain,
  CalendarHeart,
  CheckCircle2,
  Heart,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
  Users
} from 'lucide-react';

function HomePage() {
  const features = [
    {
      icon: Bot,
      title: 'AI Chat Support',
      description: '24/7 guided check-ins and wellbeing support for students who need immediate, private help.'
    },
    {
      icon: Users,
      title: 'Professional Counselors',
      description: 'A polished counselor directory with appointment booking and clear availability.'
    },
    {
      icon: Brain,
      title: 'Validated Assessments',
      description: 'PHQ-9 and GAD-7 screening flows to help students understand their current state.'
    },
    {
      icon: CalendarHeart,
      title: 'Wellness Activities',
      description: 'Campus workshops, support circles, and wellbeing events presented like a modern events portal.'
    },
    {
      icon: MessageCircle,
      title: 'Community Support',
      description: 'A moderated peer forum for anonymous sharing, replies, likes, and reporting.'
    },
    {
      icon: ShieldCheck,
      title: 'Privacy First',
      description: 'Secure authenticated experiences designed around sensitive student mental health data.'
    }
  ];

  const stats = [
    ['24/7', 'AI support access'],
    ['3 roles', 'Student, counselor, admin'],
    ['12+', 'Wellness event types'],
    ['100%', 'Campus-focused workflows']
  ];

  const testimonials = [
    '“The experience feels calm, guided, and genuinely student-centered.”',
    '“Everything a campus wellness team needs is finally in one place.”',
    '“The design makes sensitive workflows feel safe and approachable.”'
  ];

  return (
    <div className="min-h-screen overflow-hidden bg-neutral-50">
      <header className="relative z-10">
        <nav className="container-center mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-100">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-700 text-white shadow-medium">
              <Heart className="h-6 w-6" />
            </span>
            <span className="text-lg font-bold tracking-tight text-neutral-900">CampusHealth AI</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login" className="hidden rounded-xl px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-white/80 sm:block">
              Sign in
            </Link>
            <Link to="/register" className="btn-primary py-2.5 text-sm">
              Get started
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="relative">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary-50 via-white to-success-50" />
          <div className="absolute left-10 top-20 -z-10 h-80 w-80 rounded-full bg-primary-200/40 blur-3xl" />
          <div className="absolute right-0 top-32 -z-10 h-96 w-96 rounded-full bg-success-200/40 blur-3xl" />

          <div className="container-center mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8 lg:py-24">
            <div className="animate-slide-up">
              <span className="premium-kicker">
                <Sparkles className="mr-2 h-4 w-4" />
                AI-powered Campus Mental Health Platform
              </span>
              <h1 className="mt-6 max-w-4xl text-4xl font-black leading-tight tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
                Student wellbeing software that feels calm, modern, and trustworthy.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-600">
                A premium mental wellness platform for universities: AI chat support, counselor booking, assessments,
                resources, activities, community support, and admin insights in one secure product.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/register" className="btn-primary inline-flex items-center justify-center text-base">
                  Create account <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link to="/login" className="btn-outline inline-flex items-center justify-center text-base">
                  Sign in to demo
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-4 text-sm text-neutral-600">
                {['Private by design', 'Counselor-ready', 'Responsive UI'].map((item) => (
                  <span key={item} className="inline-flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success-600" /> {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="premium-shell p-4 sm:p-5">
              <div className="rounded-3xl bg-gradient-to-br from-primary-700 via-primary-600 to-success-600 p-6 text-white shadow-strong sm:p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-primary-100">Today’s wellbeing pulse</p>
                    <h2 className="mt-1 text-2xl font-bold">Campus support dashboard</h2>
                  </div>
                  <div className="rounded-2xl bg-white/15 p-3 backdrop-blur">
                    <Brain className="h-7 w-7" />
                  </div>
                </div>
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {[
                    ['AI check-ins', '142', 'private support sessions'],
                    ['Appointments', '28', 'upcoming counselor visits'],
                    ['Activities', '12', 'wellness events open'],
                    ['Resources', 'Official', 'curated public library']
                  ].map(([label, value, helper]) => (
                    <div key={label} className="rounded-2xl border border-white/20 bg-white/12 p-4 backdrop-blur">
                      <p className="text-sm text-primary-50">{label}</p>
                      <p className="mt-2 text-3xl font-bold">{value}</p>
                      <p className="mt-1 text-xs text-primary-100">{helper}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 rounded-2xl bg-white/90 p-4 text-neutral-800">
                  <p className="text-sm font-semibold text-neutral-900">Recommended next step</p>
                  <p className="mt-1 text-sm text-neutral-600">Join “Managing Exam Anxiety” or book a counselor session.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white/80 py-16">
          <div className="container-center mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map(([value, label]) => (
                <div key={label} className="metric-card text-center">
                  <p className="text-3xl font-black text-primary-700">{value}</p>
                  <p className="mt-2 text-sm font-medium text-neutral-600">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container-center mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto mb-12 max-w-3xl text-center">
              <span className="premium-kicker">Product modules</span>
              <h2 className="mt-5 text-3xl font-black text-neutral-900 sm:text-4xl">Everything a modern campus wellness team needs.</h2>
              <p className="mt-4 text-lg text-neutral-600">Built for support, early intervention, engagement, and operational clarity.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, description }) => (
                <article key={title} className="card-hover h-full">
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-neutral-600">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-br from-neutral-900 to-primary-950 py-20 text-white">
          <div className="container-center mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 lg:grid-cols-3">
              {testimonials.map((quote, index) => (
                <figure key={quote} className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur">
                  <div className="mb-5 flex gap-1 text-warning-300">
                    {[1, 2, 3, 4, 5].map((star) => <Star key={star} className="h-4 w-4 fill-current" />)}
                  </div>
                  <blockquote className="text-lg font-semibold leading-8">{quote}</blockquote>
                  <figcaption className="mt-5 text-sm text-primary-100">Campus wellness team reviewer {index + 1}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container-center mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
            <div className="premium-shell p-8 sm:p-12">
              <span className="premium-kicker">Ready for demo</span>
              <h2 className="mt-5 text-3xl font-black text-neutral-900 sm:text-4xl">Launch the wellness workspace.</h2>
              <p className="mx-auto mt-4 max-w-2xl text-neutral-600">
                Explore student, counselor, and admin experiences with a polished SaaS interface.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link to="/register" className="btn-primary inline-flex items-center justify-center">
                  Start now <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link to="/login" className="btn-outline inline-flex items-center justify-center">
                  Existing account
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-200 bg-white/80 py-8">
        <div className="container-center mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-sm text-neutral-500 sm:flex-row sm:px-6 lg:px-8">
          <p>© 2026 CampusHealth AI. Built for student wellbeing demos.</p>
          <p>Privacy-first · Healthcare-inspired · Campus-ready</p>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
