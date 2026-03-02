import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppSettings } from '@/types';

const DEFAULT_SETTINGS: AppSettings = {
    companyName: 'CÔNG TY TNHH TRUNG QUÂN HI-TECH',
    companyAddress: '15 Trần Phú, Phường Phan Rang, Tỉnh Khánh Hòa',
    companyPhone: '0258 3500 999',
    companyEmail: 'trunquan@hitech.vn',
    vatPercent: 0,
    currency: 'VND',
    // VietQR - điền sau
    bankName: '',
    bankAccountNumber: '',
    bankAccountName: 'CONG TY TNHH TRUNG QUAN HI-TECH',
    bankBin: '',
    // Telegram
    telegramBotToken: '',
    telegramChatId: '',
    // Groq AI
    groqApiKey: '',
    groqModel: 'llama-3.3-70b-versatile',
    // Google Sheets
    googleSheetId: '',
    googleAppsScriptUrl: '',
};

interface SettingsState {
    settings: AppSettings;
    updateSettings: (updates: Partial<AppSettings>) => void;
    resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            settings: DEFAULT_SETTINGS,
            updateSettings: (updates) =>
                set((s) => ({ settings: { ...s.settings, ...updates } })),
            resetSettings: () => set({ settings: DEFAULT_SETTINGS }),
        }),
        { name: 'smartshop-settings' }
    )
);
