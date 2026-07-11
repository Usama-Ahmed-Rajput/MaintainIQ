import { Button } from '@/components/ui/button'
import { Check, QrCode, Zap, BarChart3, Shield, Users, ArrowRight, Wrench, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full backdrop-blur-md bg-slate-950/50 border-b border-blue-900/20 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-2xl font-bold">
            <Wrench className="w-8 h-8 text-blue-400" />
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">MaintainIQ</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="hover:text-blue-400 transition">Features</a>
            <a href="#how-it-works" className="hover:text-blue-400 transition">How It Works</a>
            <a href="#pricing" className="hover:text-blue-400 transition">Pricing</a>
          </div>
          <Link href="/">
            <Button className="bg-blue-600 hover:bg-blue-700">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-4 pt-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="mb-6 inline-block">
            <div className="px-4 py-2 rounded-full bg-blue-900/30 border border-blue-600/50 text-sm text-blue-300">
              🚀 AI-Powered Asset Maintenance Platform
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Intelligent Asset <br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-600 bg-clip-text text-transparent">
              Maintenance Simplified
            </span>
          </h1>

          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            Real-time asset tracking, AI-powered issue triage, and QR-based maintenance workflows. 
            Reduce downtime, optimize maintenance costs, and keep your facilities running smoothly.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8">
                Start Free Trial <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-blue-600 text-blue-400 hover:bg-blue-900/20">
              Watch Demo
            </Button>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-slate-400 pb-12">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-400" />
              Enterprise Grade Security
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-green-400" />
              Trusted by 500+ Teams
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-green-400" />
              99.9% Uptime SLA
            </div>
          </div>

          {/* Hero Image / Illustration */}
          <div className="relative h-96 rounded-2xl overflow-hidden bg-gradient-to-b from-blue-900/20 to-transparent border border-blue-600/30 backdrop-blur">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <QrCode className="w-32 h-32 text-blue-400/30 mx-auto mb-4" />
                <p className="text-slate-400">Dashboard Preview</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Powerful Features for Modern Teams
            </h2>
            <p className="text-xl text-slate-400">Everything you need to manage assets efficiently</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: QrCode,
                title: 'QR Code Tracking',
                desc: 'Instant asset identification with scannable QR codes. Print labels and deploy across your facility.',
              },
              {
                icon: AlertTriangle,
                title: 'AI Triage',
                desc: 'Intelligent issue categorization and priority assignment. Smart suggestions based on asset history.',
              },
              {
                icon: BarChart3,
                title: 'Real-time Analytics',
                desc: 'Live dashboards with asset health metrics, maintenance trends, and cost analysis.',
              },
              {
                icon: Zap,
                title: 'Instant Notifications',
                desc: 'Email alerts for maintenance reminders, critical issues, and asset updates.',
              },
              {
                icon: Users,
                title: 'Team Collaboration',
                desc: 'Assign issues to technicians, track progress, and maintain complete audit trails.',
              },
              {
                icon: Shield,
                title: 'Enterprise Security',
                desc: 'Role-based access control, RLS policies, and compliant data handling.',
              },
            ].map((feature, i) => (
              <div key={i} className="p-6 rounded-xl bg-slate-900/50 border border-blue-600/20 hover:border-blue-600/50 transition group">
                <feature.icon className="w-10 h-10 text-blue-400 mb-4 group-hover:scale-110 transition" />
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-slate-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-slate-400">Simple workflow, maximum efficiency</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { num: '1', title: 'Create Assets', desc: 'Add equipment to your inventory' },
              { num: '2', title: 'Generate QR', desc: 'Auto-generate and print labels' },
              { num: '3', title: 'Report Issues', desc: 'Scan and report problems instantly' },
              { num: '4', title: 'Assign & Fix', desc: 'Track maintenance workflows' },
            ].map((step, i) => (
              <div key={i} className="relative">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    {step.num}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                  <p className="text-slate-400 text-sm">{step.desc}</p>
                </div>
                {i < 3 && (
                  <div className="hidden md:block absolute top-8 -right-6 w-12 h-1 bg-gradient-to-r from-blue-600 to-cyan-400" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Simple Pricing</h2>
            <p className="text-xl text-slate-400">Pay for what you use, scale as you grow</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Startup',
                price: '$99',
                period: '/month',
                features: ['Up to 100 Assets', 'Basic Analytics', 'Email Support', '2 Admin Accounts'],
                cta: 'Start Free Trial',
              },
              {
                name: 'Professional',
                price: '$299',
                period: '/month',
                features: ['Up to 1000 Assets', 'Advanced Analytics', 'Priority Support', 'Unlimited Admin Accounts', 'API Access'],
                cta: 'Start Free Trial',
                featured: true,
              },
              {
                name: 'Enterprise',
                price: 'Custom',
                period: 'contact us',
                features: ['Unlimited Assets', 'Custom Reports', '24/7 Dedicated Support', 'SSO & SAML', 'Custom Integrations'],
                cta: 'Contact Sales',
              },
            ].map((plan, i) => (
              <div key={i} className={`relative p-8 rounded-2xl border transition ${
                plan.featured 
                  ? 'bg-blue-600/10 border-blue-500 ring-2 ring-blue-500/50' 
                  : 'bg-slate-900/50 border-slate-700/50 hover:border-blue-600/30'
              }`}>
                {plan.featured && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-blue-600 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                )}
                
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-slate-400 ml-2">{plan.period}</span>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-400" />
                      <span className="text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button className={`w-full ${plan.featured ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-800 hover:bg-slate-700'}`}>
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border-y border-blue-600/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Maintenance?</h2>
          <p className="text-xl text-slate-300 mb-8">Join hundreds of teams managing assets smarter, faster, and more efficiently.</p>
          <Link href="/">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 px-8">
              Get Started Free <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800/50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Wrench className="w-6 h-6 text-blue-400" />
                <span className="font-bold text-lg">MaintainIQ</span>
              </div>
              <p className="text-slate-400">The intelligent platform for asset maintenance.</p>
            </div>
            {[
              { title: 'Product', links: ['Features', 'Pricing', 'Security'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers'] },
              { title: 'Resources', links: ['Docs', 'API', 'Support'] },
            ].map((col, i) => (
              <div key={i}>
                <h4 className="font-semibold mb-4">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link, j) => (
                    <li key={j}>
                      <a href="#" className="text-slate-400 hover:text-blue-400 transition">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="border-t border-slate-800/50 pt-8 flex flex-col md:flex-row items-center justify-between">
            <p className="text-slate-400">&copy; 2024 MaintainIQ. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="text-slate-400 hover:text-blue-400 transition">Privacy</a>
              <a href="#" className="text-slate-400 hover:text-blue-400 transition">Terms</a>
              <a href="#" className="text-slate-400 hover:text-blue-400 transition">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
