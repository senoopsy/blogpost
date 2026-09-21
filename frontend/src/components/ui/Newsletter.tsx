import { Mail, ArrowRight } from 'lucide-react';
import { useState } from 'react';

export function Newsletter() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setEmail('');
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="glass-card p-6 relative overflow-hidden">
      {/* Background gradient decoration */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-accent-primary/20 to-accent-secondary/20 rounded-full blur-3xl" />

      <div className="relative">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <h3 className="font-bold text-lg">Stay Updated</h3>
        </div>

        <p className="text-text-secondary text-sm mb-4">
          Get the latest tech news delivered to your inbox daily.
        </p>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="flex-1 glass-input text-sm"
            required
          />
          <button
            type="submit"
            className="glass-btn-primary px-4 py-2.5 flex items-center gap-1"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {submitted && (
          <p className="mt-3 text-xs text-accent-success animate-fade-in">
            ✓ Thanks for subscribing!
          </p>
        )}
      </div>
    </div>
  );
}