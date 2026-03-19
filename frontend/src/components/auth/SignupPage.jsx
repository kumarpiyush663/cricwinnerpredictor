import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Trophy, Eye, EyeOff, Loader2, Check, X } from 'lucide-react';
import { validatePassword } from '../../lib/utils';

export const SignupPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [error, setError] = useState('');
  const [inviteData, setInviteData] = useState(null);
  const [passwordStrength, setPasswordStrength] = useState({ isValid: false, errors: [] });
  
  const { signup, validateInvite } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const watchPassword = watch('password', '');

  useEffect(() => {
    if (watchPassword) {
      setPasswordStrength(validatePassword(watchPassword));
    }
  }, [watchPassword]);

  useEffect(() => {
    const validate = async () => {
      if (!token) {
        setError('No invite token provided');
        setValidating(false);
        return;
      }

      const result = await validateInvite(token);
      if (result.success) {
        setInviteData(result.data);
      } else {
        setError(result.error);
      }
      setValidating(false);
    };

    validate();
  }, [token, validateInvite]);

  const onSubmit = async (data) => {
    if (!passwordStrength.isValid) {
      setError('Please meet all password requirements');
      return;
    }

    setLoading(true);
    setError('');

    const result = await signup(token, data.password);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Validating invite...</p>
        </div>
      </div>
    );
  }

  if (!inviteData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md" data-testid="invalid-invite-card">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <X className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-red-600">Invalid Invite</CardTitle>
            <CardDescription>{error || 'This invite link is invalid or has expired.'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => navigate('/login')}
              data-testid="back-to-login"
            >
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="auth-split">
      {/* Left side - Image */}
      <div 
        className="hidden lg:flex items-center justify-center relative overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(5, 150, 105, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%), url('https://images.pexels.com/photos/9828070/pexels-photo-9828070.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="text-center text-white p-12">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h1 className="font-heading text-4xl font-black uppercase italic mb-4">
            Welcome to the League!
          </h1>
          <p className="text-white/80 max-w-md mx-auto">
            Create your account and start predicting match winners
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-heading text-2xl font-bold">Welcome!</h1>
          </div>

          <Card className="border-0 shadow-xl" data-testid="signup-card">
            <CardHeader className="space-y-1">
              <CardTitle className="font-heading text-2xl">Create Account</CardTitle>
              <CardDescription>
                Complete your registration to join the prediction league
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                  <Alert variant="destructive" data-testid="signup-error">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={inviteData.full_name}
                    disabled
                    className="bg-muted"
                    data-testid="signup-fullname"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={inviteData.username}
                    disabled
                    className="bg-muted"
                    data-testid="signup-username"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={inviteData.email}
                    disabled
                    className="bg-muted"
                    data-testid="signup-email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a strong password"
                      data-testid="signup-password"
                      {...register('password', { required: 'Password is required' })}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-500">{errors.password.message}</p>
                  )}

                  {/* Password requirements */}
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">Password requirements:</p>
                    {[
                      { label: 'At least 8 characters', check: watchPassword.length >= 8 },
                      { label: 'One uppercase letter', check: /[A-Z]/.test(watchPassword) },
                      { label: 'One number', check: /[0-9]/.test(watchPassword) },
                      { label: 'One special character', check: /[!@#$%^&*(),.?":{}|<>]/.test(watchPassword) }
                    ].map((req, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        {req.check ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <X className="h-3 w-3 text-muted-foreground" />
                        )}
                        <span className={req.check ? 'text-green-600' : 'text-muted-foreground'}>
                          {req.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full rounded-full font-bold uppercase tracking-wide"
                  disabled={loading || !(
                    watchPassword.length >= 8 &&
                    /[A-Z]/.test(watchPassword) &&
                    /[0-9]/.test(watchPassword) &&
                    /[!@#$%^&*(),.?":{}|<>]/.test(watchPassword)
                  )}
                  data-testid="signup-submit"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
