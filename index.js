const express=require("express");
const socket =require("socket.io");
const http=require("http");
const {Chess} = require("chess.js");
const path=require("path");
const { title } = require("process");

const app=express();

const server=http.createServer(app);
const io=socket(server);

const chess=new Chess();

let players={};
let currentPlayer="w";

app.set("view engine","ejs");
app.use(express.static(path.join(__dirname,"public")));

app.get("/",(req,res)=>{
    res.render("index.ejs",{title:"Chess Game"});
})

io.on("connection",function(uniquesocket){
    console.log("connected");
    if(!players.white){
        players.white=uniquesocket.id;
        uniquesocket.emit("playerRole","w");
    }else if (!players.black){
        players.black=uniquesocket.id;
        uniquesocket.emit("playerRole","b");
    }else{
        uniquesocket.emit("spectatorRole");
    }
    
    uniquesocket.on("move",(move)=>{
        try {
            //white moving only white
            if(chess.turn() ==="w" && uniquesocket.id !== players.white ) return;
            
            //black moving only black
            if(chess.turn() ==="b" && uniquesocket.id !== players.black ) return;

            const result=chess.move(move);

            if(result){
                currentPlayer=chess.turn();
                io.emit("move",move);
                io.emit("boardState",chess.fen()) 
            }else{
                console.log("Invalid move :",move);
                uniquesocket.emit("invalidMove ",move);
            }
        } catch (error) {
            console.log(err);
            uniquesocket.emit("InvalidMove :",move);
        }
    })


    uniquesocket.on("disconnect",()=>{
        if(uniquesocket.id === players.white){
            delete players.white;
        }
        else if(uniquesocket.id === players.black){
            delete players.black;
        }
    })

})

const port=3000;
server.listen(port,()=>{
    console.log(`listening on port ${port}`);
})