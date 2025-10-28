import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import db from '../db.js';

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: 'http://localhost:5500/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  // Cek user di DB berdasarkan profile.emails[0].value
  let user = db.prepare('SELECT * FROM users WHERE email = ?').get(profile.emails[0].value);
  if (!user) {
    // Jika belum ada, buat user baru
    const insertUser = db.prepare('INSERT INTO users (username, email) VALUES (?, ?)');
    const result = insertUser.run(profile.displayName, profile.emails[0].value);
    user = { id: result.lastInsertRowid, username: profile.displayName, email: profile.emails[0].value };
  }
  done(null, user);
}));

passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((user, done) => {
  done(null, user);
});

export default passport;


// YK WHAT? I HATE THIS FITUR :V
