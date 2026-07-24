import React from 'react';
import { Link } from 'react-router-dom';
import { PublicHeader } from '../components/PublicHeader';
import { ArrowRight, CheckCircle2, Shield, Zap, MessageSquare, Users, BarChart3, HeadphonesIcon } from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-capita-light font-sans text-capita-text flex flex-col">
      <PublicHeader />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative bg-capita-navy text-white overflow-hidden">
          {/* Abstract background shapes */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-20 -top-20 w-96 h-96 rounded-full border-[40px] border-capita-cyan"></div>
            <div className="absolute -left-20 bottom-0 w-64 h-64 rounded-full border-[20px] border-capita-cyan"></div>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 relative z-10">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                Corporate <span className="text-capita-cyan">helpdesk</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl leading-relaxed">
                Capita’s corporate helpdesk delivers expert support and fast issue resolution to improve employee experience and boost operational efficiency.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 bg-capita-cyan text-capita-navy hover:bg-white transition-colors px-6 py-3.5 rounded-md font-bold text-base shadow-lg"
                >
                  Go to Dashboard <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/knowledge-base"
                  className="inline-flex items-center gap-2 bg-transparent text-white border-2 border-gray-500 hover:border-white transition-colors px-6 py-3.5 rounded-md font-bold text-base"
                >
                  Explore Knowledge Base
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Value Proposition / Teaser Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl font-bold text-capita-navy mb-6">
                  Simplify processes, improve lives, and deliver results at scale.
                </h2>
                <p className="text-capita-slate text-lg mb-6 leading-relaxed">
                  We’re experts in driving efficiencies across processes. Our work simplifies operations, allowing your workforce to focus on what matters most. With advanced ticket routing, AI-driven insights, and a seamless user experience, our corporate helpdesk ensures your teams are never blocked by technical hurdles.
                </p>
                <ul className="space-y-4">
                  {[
                    'Omnichannel support (Web, Chat, Email)',
                    'Intelligent ticket routing & assignment',
                    'Comprehensive knowledge base',
                    'Real-time SLA tracking and analytics'
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-capita-cyan flex-shrink-0" />
                      <span className="text-capita-slate font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Feature Cards Grid mimicking the Capita teaser images */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-capita-gray p-6 rounded-xl flex flex-col items-center text-center gap-4 mt-8">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <Shield className="w-8 h-8 text-capita-navy" />
                  </div>
                  <h3 className="font-bold text-capita-navy">Secure</h3>
                  <p className="text-sm text-capita-slate">Enterprise-grade security and role-based access.</p>
                </div>
                <div className="bg-capita-navy text-white p-6 rounded-xl flex flex-col items-center text-center gap-4 mb-8 shadow-xl">
                  <div className="w-16 h-16 bg-capita-slate/30 rounded-full flex items-center justify-center">
                    <Zap className="w-8 h-8 text-capita-cyan" />
                  </div>
                  <h3 className="font-bold">Fast Resolution</h3>
                  <p className="text-sm text-gray-300">Automated workflows to speed up response times.</p>
                </div>
                <div className="bg-white border border-gray-200 p-6 rounded-xl flex flex-col items-center text-center gap-4 shadow-sm">
                  <div className="w-16 h-16 bg-capita-gray rounded-full flex items-center justify-center">
                    <MessageSquare className="w-8 h-8 text-capita-navy" />
                  </div>
                  <h3 className="font-bold text-capita-navy">Live Chat</h3>
                  <p className="text-sm text-capita-slate">Instant communication with support agents.</p>
                </div>
                <div className="bg-capita-gray p-6 rounded-xl flex flex-col items-center text-center gap-4 -mt-8">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <BarChart3 className="w-8 h-8 text-capita-navy" />
                  </div>
                  <h3 className="font-bold text-capita-navy">Insights</h3>
                  <p className="text-sm text-capita-slate">Detailed reporting on team performance.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services / What We Do Section */}
        <section className="py-20 bg-capita-gray">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold text-capita-navy mb-4">Our Services</h2>
              <p className="text-capita-slate text-lg">
                Discover the comprehensive suite of tools built into our Corporate Helpdesk platform to support your entire organization.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Users className="w-8 h-8 text-capita-cyan" />,
                  title: 'Employee Self-Service',
                  desc: 'Empower employees to find answers quickly using our rich knowledge base and automated troubleshooting guides.'
                },
                {
                  icon: <Zap className="w-8 h-8 text-capita-cyan" />,
                  title: 'AI Solutions',
                  desc: 'Meet our AI agents that automatically triage incoming requests, suggest resolutions, and handle routine inquiries.'
                },
                {
                  icon: <Shield className="w-8 h-8 text-capita-cyan" />,
                  title: 'IT Service Management',
                  desc: 'Align your IT services with business needs through structured incident, problem, and change management workflows.'
                }
              ].map((service, idx) => (
                <div key={idx} className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow group border-t-4 border-transparent hover:border-capita-cyan">
                  <div className="w-14 h-14 bg-capita-navy rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    {service.icon}
                  </div>
                  <h3 className="text-xl font-bold text-capita-navy mb-3">{service.title}</h3>
                  <p className="text-capita-slate">{service.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-capita-navy text-white text-center relative overflow-hidden">
           <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full h-full max-w-4xl opacity-10 pointer-events-none">
             <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-capita-cyan via-capita-navy to-capita-navy"></div>
           </div>
           <div className="relative z-10 max-w-3xl mx-auto px-4">
             <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to transform your support experience?</h2>
             <p className="text-lg text-gray-300 mb-10">
               Join thousands of employees who rely on our platform for fast, reliable, and intelligent support every day.
             </p>
             <Link
                to="/login"
                className="inline-flex items-center gap-2 bg-capita-cyan text-capita-navy hover:bg-white transition-colors px-8 py-4 rounded-md font-bold text-lg shadow-xl"
              >
                Log In to Helpdesk
              </Link>
           </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#01041c] text-gray-400 py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">What we do</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-capita-cyan transition-colors">Services</a></li>
                <li><a href="#" className="hover:text-capita-cyan transition-colors">Industries</a></li>
                <li><a href="#" className="hover:text-capita-cyan transition-colors">Case Studies</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">About us</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-capita-cyan transition-colors">Who we are</a></li>
                <li><a href="#" className="hover:text-capita-cyan transition-colors">Leadership</a></li>
                <li><a href="#" className="hover:text-capita-cyan transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Investors</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-capita-cyan transition-colors">Financial results</a></li>
                <li><a href="#" className="hover:text-capita-cyan transition-colors">Shareholder info</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-capita-cyan transition-colors">Get in touch</a></li>
                <li><a href="#" className="hover:text-capita-cyan transition-colors">Office locations</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <HeadphonesIcon className="w-5 h-5 text-gray-600" />
              <span>&copy; {new Date().getFullYear()} Capita Corporate Helpdesk. All rights reserved.</span>
            </div>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Use</a>
              <a href="#" className="hover:text-white transition-colors">Accessibility</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
