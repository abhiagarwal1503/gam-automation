import { initDatabase, db } from '../database/db';
import { settingsRepo } from '../repositories';

initDatabase();

const current = settingsRepo.get() || {};
current.networkCode = '22068249324';
current.networkName = 'Blinkcorp Technologies Private Limited';
current.timeZone = 'Asia/Kolkata';
current.currencyCode = 'INR';
current.isConnected = true;

settingsRepo.save(current);
console.log('✅ Settings updated with live network details for Blinkcorp Technologies Private Limited!');
