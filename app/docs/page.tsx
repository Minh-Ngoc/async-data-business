'use client'

import { title } from "@/components/primitives";
import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import { useEffect, useState } from "react";
import { socketStore } from "@/store/socketStore";
import { taskStore } from "@/store/taskStore";
import { EVENTS_MESSAGE } from "@/constants";
import axios from "axios";

export default function DocsPage() {
	const { socket } = socketStore();
	const { tasks, setTasks, addTasks, updateTask, deleteTask } = taskStore();
  const [value, setValue] = useState('');

  useEffect(() => {
		socket.on(EVENTS_MESSAGE.NEW_TASK, (data: any) => {
      if(data.status === 1) {
        addTasks(data.task);
      }
		});

    socket.on(EVENTS_MESSAGE.UPDATE_TASK, (data: any) => {
      if(data.status === 1) {
        updateTask(data.task);
      }
		});

    socket.on(EVENTS_MESSAGE.DELETE_TASK, (data: any) => {
      if(data.status === 1) {
        deleteTask(data.task);
      }
		});

		return () => {
			socket.off(EVENTS_MESSAGE.NEW_TASK);
			socket.off(EVENTS_MESSAGE.UPDATE_TASK);
			socket.off(EVENTS_MESSAGE.DELETE_TASK);
		};
	}, []);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get("http://localhost:8000/tasks");

        if(data?.status === 1) {
          setTasks(data?.tasks);
        }
      } catch (error) {
        console.log('error: ', error);
      }
    })()

    return () => {};
  }, []);

  const handleSubmit = () => {
    socket.emit(EVENTS_MESSAGE.NEW_TASK, {
      name: value
    });

    setValue('');
  }

	return (
		<div className={title()}>
			<h1>Docs</h1>

      <div className="max-w-96 mt-5 flex gap-2">
        <Input
          fullWidth
          variant="bordered"
          placeholder="Nhập Task..."
          color="primary"
          value={value}
          onValueChange={setValue}
        />

        <Button 
          variant="solid"
          color="primary"
          onPress={handleSubmit}
        >
          Gửi
        </Button>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {!!tasks?.length && tasks?.map(
          (task, index) => (
            <div key={index}>
              <p className={`text-base`}>{task?.name}</p>
            </div>
          )
        )}
      </div>
		</div>
	);
}
