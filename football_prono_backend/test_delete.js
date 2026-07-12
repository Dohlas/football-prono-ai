import db from "./config/database.js";
import { generateToken } from "./services/authService.js";
import fetch from "node-fetch";

setTimeout(async () => {
    const user = { id: 3, email: "test_user_e2e_47@gmail.com" };
    const token = generateToken(user);
    console.log("Token:", token);

    const res = await fetch("http://localhost:3000/api/predictions/history/1", {
        method: "DELETE",
        headers: {
            "Authorization": "Bearer " + token
        }
    });
    
    console.log("Status:", res.status);
    console.log("Body:", await res.json());
}, 500);
