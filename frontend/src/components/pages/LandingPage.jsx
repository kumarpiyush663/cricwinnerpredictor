import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Trophy, Target, BarChart3, Users, ArrowRight, Star } from 'lucide-react';

export const LandingPage = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: Target,
      title: 'Make Predictions',
      description: 'Predict match winners before the cutoff and compete with others'
    },
    {
      icon: BarChart3,
      title: 'Live Leaderboard',
      description: 'Track your ranking in real-time as results come in'
    },
    {
      icon: Users,
      title: 'Compete with Friends',
      description: 'Join your office or friend league and see who tops the table'
    },
    {
      icon: Trophy,
      title: 'Win Recognition',
      description: 'End-of-tournament reports showcase the prediction champions'
    }
  ];

  return (
    <div className="min-h-screen" data-testid="landing-page">
      {/* Hero Section */}
      <section 
        className="relative min-h-[80vh] flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(5, 150, 105, 0.95) 0%, rgba(4, 120, 87, 0.9) 40%, rgba(15, 23, 42, 0.98) 100%), url('https://images.unsplash.com/photo-1750716413341-fd5d93296a76?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTB8MHwxfHNlYXJjaHw0fHxjcmlja2V0JTIwc3RhZGl1bSUyMG5pZ2h0JTIwbWF0Y2glMjBsaWdodHN8ZW58MHx8fHwxNzczOTQ0MjI2fDA&ixlib=rb-4.1.0&q=85')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center text-white relative z-10">
          <div className="animate-fade-in-up">
            <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <Trophy className="w-12 h-12 text-yellow-400" />
            </div>
            
            <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-black uppercase italic mb-6 tracking-tight">
              Cricket Tournament
              <br />
              <span className="text-yellow-400">Predictor League</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto mb-10">
              Predict match winners, climb the leaderboard, and prove you're the ultimate cricket expert
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Link to="/dashboard">
                  <Button size="lg" className="rounded-full font-bold uppercase tracking-wide px-8 py-6 text-lg bg-white text-emerald-700 hover:bg-white/90" data-testid="go-to-dashboard">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/login">
                    <Button size="lg" className="rounded-full font-bold uppercase tracking-wide px-8 py-6 text-lg bg-white text-emerald-700 hover:bg-white/90" data-testid="get-started-btn">
                      Get Started
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button size="lg" variant="outline" className="rounded-full font-bold uppercase tracking-wide px-8 py-6 text-lg border-white/30 text-white hover:bg-white/10" data-testid="login-hero-btn">
                      Login
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold uppercase mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Join the prediction league in three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, idx) => (
              <div 
                key={feature.title}
                className={`group p-6 rounded-2xl border bg-card hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-fade-in-up animate-delay-${(idx + 1) * 100}`}
                data-testid={`feature-${idx}`}
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-heading text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/50">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '100+', label: 'Predictions Daily' },
              { value: '50+', label: 'Active Users' },
              { value: '95%', label: 'Accuracy Rate' },
              { value: '10+', label: 'Tournaments' }
            ].map((stat, idx) => (
              <div key={stat.label} data-testid={`stat-${idx}`}>
                <div className="font-heading text-4xl sm:text-5xl font-black text-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground uppercase tracking-wide">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="flex justify-center mb-6">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-8 h-8 text-yellow-400 fill-yellow-400" />
            ))}
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold uppercase mb-6">
            Ready to Test Your Cricket Knowledge?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Get an invite from your admin and join the prediction league today
          </p>
          {!isAuthenticated && (
            <Link to="/login">
              <Button size="lg" className="rounded-full font-bold uppercase tracking-wide px-8 py-6 text-lg" data-testid="cta-login">
                Login to Start Predicting
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t bg-background">
        <div className="container mx-auto max-w-7xl text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 Cricket Tournament Predictor League. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
