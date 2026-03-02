import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { RepairTicket, RentalContract, RentalCounterLog } from '@/types';

interface ServiceState {
    repairTickets: RepairTicket[];
    rentalContracts: RentalContract[];
    counterLogs: RentalCounterLog[];

    // Repair
    addRepairTicket: (data: Omit<RepairTicket, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt'>) => RepairTicket;
    updateRepairTicket: (id: string, updates: Partial<RepairTicket>) => void;
    deleteRepairTicket: (id: string) => void;

    // Rental
    addRentalContract: (data: Omit<RentalContract, 'id' | 'contractNumber' | 'createdAt'>) => RentalContract;
    updateRentalContract: (id: string, updates: Partial<RentalContract>) => void;
    addCounterLog: (log: Omit<RentalCounterLog, 'id' | 'createdAt'>) => RentalCounterLog;
}

export const useServiceStore = create<ServiceState>()(
    persist(
        (set, get) => ({
            repairTickets: [],
            rentalContracts: [],
            counterLogs: [],

            addRepairTicket: (data) => {
                const now = new Date().toISOString();
                const count = get().repairTickets.length + 1;
                const ticket: RepairTicket = {
                    ...data,
                    id: uuidv4(),
                    ticketNumber: `SC${new Date().getFullYear()}${String(count).padStart(4, '0')}`,
                    createdAt: now,
                    updatedAt: now,
                };
                set((s) => ({ repairTickets: [ticket, ...s.repairTickets] }));
                return ticket;
            },

            updateRepairTicket: (id, updates) =>
                set((s) => ({
                    repairTickets: s.repairTickets.map((t) =>
                        t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
                    ),
                })),

            deleteRepairTicket: (id) =>
                set((s) => ({ repairTickets: s.repairTickets.filter((t) => t.id !== id) })),

            addRentalContract: (data) => {
                const count = get().rentalContracts.length + 1;
                const contract: RentalContract = {
                    ...data,
                    id: uuidv4(),
                    contractNumber: `HT${new Date().getFullYear()}${String(count).padStart(4, '0')}`,
                    createdAt: new Date().toISOString(),
                };
                set((s) => ({ rentalContracts: [contract, ...s.rentalContracts] }));
                return contract;
            },

            updateRentalContract: (id, updates) =>
                set((s) => ({
                    rentalContracts: s.rentalContracts.map((c) => (c.id === id ? { ...c, ...updates } : c)),
                })),

            addCounterLog: (data) => {
                const log: RentalCounterLog = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
                set((s) => ({ counterLogs: [log, ...s.counterLogs] }));
                return log;
            },
        }),
        { name: 'smartshop-service' }
    )
);
