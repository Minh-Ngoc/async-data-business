import { socketStore } from "@/store/socketStore";
import { useEffect } from "react";

const SocketProvider = ({ children }: { children: React.ReactNode }) => {
	const { socket } = socketStore();

	useEffect(() => {
		socket.on("connect", () => {
			console.log("Connected!");
		});

		return () => {
			console.log("Unregistering Events...");

			socket.off("connect");
		};
	}, []);

	return children;
};

export default SocketProvider;
