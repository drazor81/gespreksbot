import './style.css';
import './voice.css';
import { initUI } from './ui';
import { initTurnstile } from './security/turnstile';

initUI();
void initTurnstile(import.meta.env.VITE_TURNSTILE_SITE_KEY);
