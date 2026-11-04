import {AppError} from './commerce.mjs';
export const demoEmails={seller:'sotuvchi@demo.savdochi.invalid',buyer:'xaridor@demo.savdochi.invalid'};
export const demoPassword='SavdochiDemo2026!';
export function sameMarket(a,b){if(Boolean(a?.isDemo)!==Boolean(b?.isDemo))throw new AppError('Demo hisob faqat demo hamkorlar bilan ishlaydi',403);}
export const marketFilter=user=>user?.isDemo?{isDemo:true}:{isDemo:{$ne:true}};
export function requirePersonalAccount(user){if(user.isDemo)throw new AppError('Bu umumiy demo hisob. Parol, Telegram va tekshiruv uchun shaxsiy hisob oching.',403);}
