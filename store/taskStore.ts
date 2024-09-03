import { create } from "zustand";

interface TaskStoreState {
    tasks: any[];
    setTasks: (payload: any) => void;
    addTasks: (payload: any) => void;
    updateTask: (payload: any) => void;
    deleteTask: (payload: any) => void;
}

export const taskStore = create<TaskStoreState>((set) => ({
    tasks: [],

    setTasks: (payload: any) => {
        set((state) => ({
            ...state,
            tasks: payload,
        }));
    },

    addTasks: (payload: any) => {
        set((state) => ({
            ...state,
            tasks: [...state.tasks, payload],
        }));
    },

    updateTask: (payload: any) => {
        set((state) => {
            const newTasks = state.tasks?.map(
                (item: any) => {
                if(item?._id === payload?._id) {
                    return payload
                }
    
                return item;
                }
            );

            return {
                ...state,
                tasks: newTasks
            }
        });
    },

    deleteTask: (payload: any) => {
        set((state) => {
            const newTasks = state.tasks?.filter((task) => task?._id !== payload);

            return {
                ...state,
                tasks: newTasks
            }
        });
    },
}));
