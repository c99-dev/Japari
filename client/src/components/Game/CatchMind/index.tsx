/** @jsxImportSource @emotion/react */
import React, { useRef, useState, useEffect, useCallback } from "react";
import * as style from "./styles";
import timerImage from "../../../assets/icons/timer.png";
import { useRecoilState, useRecoilValue } from "recoil";
import { userState } from "../../../store/user";
import { socketState } from "../../../store/socket";
import { currentScoreState } from "../../../store/catchmind";
import { debounce } from "lodash";

import pencilIcon from "../../../assets/icons/catch-mind-pencil.png";
import eraserIcon from "../../../assets/icons/catch-mind-eraser.png";
import paletteLockIcon from "../../../assets/icons/palette-lock.png";
import { useNavigate, useLocation } from "react-router-dom";
import { User } from "@dto";

const DEFAULT_FONT = "50px LINESeedKR bold";

enum Color {
  WHITE = "white",
  BLACK = "black",
  RED = "red",
  YELLOW = "yellow",
  GREEN = "green",
  PURPLE = "purple",
  GRAY = "gray",
  ORANGE = "orange",
  BLUE = "blue",
  SKYBLUE = "skyblue",
  PINK = "pink",
  BROWN = "brown",
  GOLD = "gold",
  DARKBLUE = "darkblue",
}

const WAIT_TIME = 5;
const DRAW_TIME = 120; // 120
const RESULT_TIME = 10; //15

enum CatchMindState {
  WAIT,
  DRAW,
  RESULT,
}

const COLOR_LIST = [
  "BLACK",
  "RED",
  "ORANGE",
  "YELLOW",
  "GREEN",
  "BLUE",
  "DARKBLUE",
  "PURPLE",
  "GRAY",
  "SKYBLUE",
  "PINK",
  "BROWN",
];

const THIN = 1;
const NORMAL = 5;
const THICK = 9;

interface CatchMindProps {
  participants: User[];
}

export default function CatchMind({ participants }: CatchMindProps) {
  const navigate = useNavigate();
  const path = useLocation().pathname.split("/").slice(1)[1];

  const socket = useRecoilValue(socketState);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<"pencil" | "eraser">("pencil");
  const [line, setLine] = useState<"THIN" | "NORMAL" | "THICK">("NORMAL");
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState<string>("black");
  const currentColorRef = useRef<string>("black");

  const [, setCurrentScore] = useRecoilState(currentScoreState);
  const [user] = useRecoilState(userState);
  const [time, setTime] = useState<number>(WAIT_TIME);
  const timeRef = useRef<number | null>(null);
  const [infoText, setInfoText] = useState<string>("");
  const [round, setRound] = useState<number>(1);
  const roundRef = useRef<number>(1);
  const stateRef = useRef<number>(0);
  const [drawerId, setDrawerId] = useState<number>(0);

  const timer = useRef<NodeJS.Timer | null>(null);
  if (timeRef) {
    timeRef.current = time;
  }
  roundRef.current = round;
  currentColorRef.current = currentColor;

  const getContextObject = useCallback(() => {
    const ctx = canvasRef.current?.getContext("2d");
    return ctx as CanvasRenderingContext2D;
  }, []);

  const clearCanvas = useCallback(() => {
    const ctx = getContextObject();
    ctx.fillStyle = Color.WHITE;
    ctx.fillRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
    ctx.fillStyle = currentColorRef.current;
    ctx.beginPath();
  }, []);

  const writeCenter = useCallback(
    (text: string, option?: { color?: string; size?: string; dx?: number; dy?: number }) => {
      const canvas = canvasRef.current as HTMLCanvasElement;
      const ctx = getContextObject();
      ctx.beginPath();
      // 옵션 적용
      ctx.fillStyle = option?.color ?? "black";
      if (option?.size) {
        ctx.font = option.size + " LINESeedKR";
      }

      const metrics = ctx.measureText(text);
      const width = metrics.width;
      const height = metrics.actualBoundingBoxDescent - metrics.actualBoundingBoxAscent;

      const x = canvas.width / 2 - width / 2;
      const y = canvas.height / 2 - height / 2;

      ctx.fillText(text, x + (option?.dx ?? 0), y + (option?.dy ?? 0));

      // 옵션 reset
      ctx.font = DEFAULT_FONT;
      ctx.fillStyle = currentColorRef.current;
      ctx.beginPath();
    },
    []
  );

  const handleDebounce = useCallback(
    debounce(imageSrc => {
      socket.emit("catch-mind/image", { round, imageSrc });
    }, 100),
    [round]
  );

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const startDrawing = useCallback((e: MouseEvent) => {
    setIsDrawing(true);
  }, []);

  const onDrawing = useCallback(
    (e: MouseEvent) => {
      const ctx = getContextObject();
      if (isDrawing) {
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
        const imageData = canvasRef.current?.toDataURL("image/png");
        handleDebounce(imageData);
      }
      ctx.moveTo(e.offsetX, e.offsetY);
    },
    [isDrawing]
  );

  // event handlers
  const handlePencilMode = useCallback(() => {
    if (drawerId !== user?.userId) return;
    if (stateRef.current !== CatchMindState.DRAW) return;
    setMode("pencil");
  }, [drawerId, user]);

  const handleEraserMode = useCallback(() => {
    if (drawerId !== user?.userId) return;
    if (stateRef.current !== CatchMindState.DRAW) return;
    setMode("eraser");
  }, [drawerId, user]);

  const handleLineWidth = useCallback((line: "THIN" | "NORMAL" | "THICK") => {
    if (drawerId !== user?.userId) return;
    if (stateRef.current !== CatchMindState.DRAW) return;
    setLine(line);

    const ctx = getContextObject();
    ctx.beginPath();
    switch (line) {
      case "THIN":
        ctx.lineWidth = THIN;
        break;
      case "NORMAL":
        ctx.lineWidth = NORMAL;
        break;
      case "THICK":
        ctx.lineWidth = THICK;
        break;
    }
    ctx.closePath();
  }, []);

  const handleClear = useCallback(() => {
    if (drawerId !== user?.userId) return;
    if (stateRef.current !== CatchMindState.DRAW) return;
    clearCanvas();
  }, [drawerId, user]);

  const handleSelectColor = useCallback(
    (color: string) => {
      if (user?.userId !== drawerId || stateRef.current !== CatchMindState.DRAW) return;
      setCurrentColor(color);
    },
    [drawerId]
  );

  useEffect(() => {
    socket.on("catch-mind/round-start", data => {
      stateRef.current = CatchMindState.WAIT;

      if (data.answer) setInfoText(infoText);
      setRound(data.round);
      setDrawerId(data.drawerId);

      clearCanvas();
      writeCenter(`Round ${data.round} 준비`);

      if (data.answer) {
        setInfoText(data.answer);
      } else {
        const drawerName = participants.filter(user => user.userId === data.drawerId)[0].nickname;
        setInfoText(`${drawerName} 님의 그림`);
      }
      setTime(WAIT_TIME);
    });
    return () => {
      socket.off("catch-mind/round-start");
    };
  }, [socket]);

  useEffect(() => {
    socket.on("catch-mind/draw-start", data => {
      stateRef.current = CatchMindState.DRAW;

      clearCanvas();
      writeCenter(`Round ${data.round} 시작!`);

      setTimeout(() => {
        clearCanvas();
      }, 1000);

      setTime(DRAW_TIME);
    });

    return () => {
      socket.off("catch-mind/draw-start");
    };
  }, [socket]);

  useEffect(() => {
    socket.on("catch-mind/result", data => {
      stateRef.current = CatchMindState.RESULT;
      setCurrentScore(data);
      clearCanvas();
      const ctx = getContextObject();
      writeCenter(`정답 공개`, { color: "black", dx: 0, dy: -90 });
      writeCenter(`${data.answer}`, { color: "red", size: "75px", dx: 0, dy: 30 });
      ctx.fillStyle = currentColorRef.current;

      setTime(RESULT_TIME);
    });

    return () => {
      socket.off("catch-mind/result");
    };
  }, [socket]);

  // 타이머
  useEffect(() => {
    timer.current = setInterval(() => {
      if (timeRef.current && timeRef.current > 0) {
        setTime(time => time - 1);
      }
    }, 1000);

    return () => {
      if (timer.current) {
        clearInterval(timer.current);
      }
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (stateRef.current !== CatchMindState.DRAW) return;
    if (drawerId !== user?.userId) return;
    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", onDrawing);
    canvas.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("mouseleave", stopDrawing);
    return () => {
      canvas.removeEventListener("mousedown", startDrawing);
      canvas.removeEventListener("mousemove", onDrawing);
      canvas.removeEventListener("mouseup", stopDrawing);
      canvas.removeEventListener("mouseleave", stopDrawing);
    };
  }, [startDrawing, onDrawing, stopDrawing, stateRef.current, drawerId]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = 800;
    canvas.height = 510;

    const ctx = getContextObject();
    ctx.font = DEFAULT_FONT;
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
  }, []);

  useEffect(() => {
    socket.on("catch-mind/image", data => {
      const image = new Image();
      image.onload = () => {
        if (roundRef.current !== data.round) return;
        if (stateRef.current !== CatchMindState.DRAW) return;
        const ctx = getContextObject();
        ctx.drawImage(image, 0, 0);
      };
      image.src = data.imageSrc;
    });
    return () => {
      socket.off("catch-mind/image");
    };
  }, [socket]);

  useEffect(() => {
    socket.on("catch-mind/end", () => {
      setCurrentScore(null);
      navigate(`/waiting/${path}`);
    });
  }, []);

  useEffect(() => {
    const ctx = getContextObject();
    ctx.beginPath();
    ctx.strokeStyle = currentColor;
    ctx.fillStyle = currentColor;
  }, [currentColor]);

  useEffect(() => {
    const ctx = getContextObject();
    if (mode === "pencil") {
      ctx.beginPath();
      ctx.strokeStyle = currentColorRef.current;
    }
    if (mode === "eraser") {
      ctx.beginPath();
      ctx.strokeStyle = Color.WHITE;
    }
  }, [mode]);

  return (
    <div css={style.gameWrapperStyle}>
      <div css={style.gameViewStyle}>
        <div css={style.headerStyle}>
          <div css={style.timerStyle}>
            <img src={timerImage} alt="timer" />
            <span>{time}</span>
          </div>

          <div css={style.answerStyle(drawerId === user?.userId)}>
            <span>{infoText}</span>
          </div>

          <div css={style.roundStyle}>
            <span>Round {round} / 5</span>
          </div>
        </div>

        <div css={style.canvasStyle}>
          <canvas ref={canvasRef} />
        </div>
      </div>

      <div css={style.paletteStyle}>
        {drawerId !== user?.userId && (
          <div css={style.palleteLockStyle}>
            <img src={paletteLockIcon} alt="palette-lock-icon" />
          </div>
        )}
        <div css={style.toolStyle}>
          <div css={style.toggleStyle(mode, "pencil")} onClick={handlePencilMode}>
            <img src={pencilIcon} alt="pencil" />
          </div>

          <div css={style.toggleStyle(mode, "eraser")} onClick={handleEraserMode}>
            <img src={eraserIcon} alt="eraser" />
          </div>
        </div>

        <div css={style.lineWidthStyle}>
          <div onClick={() => handleLineWidth("THIN")} css={style.buttonStyle(line, "THIN")}>
            얇게
          </div>
          <div onClick={() => handleLineWidth("NORMAL")} css={style.buttonStyle(line, "NORMAL")}>
            보통
          </div>
          <div onClick={() => handleLineWidth("THICK")} css={style.buttonStyle(line, "THICK")}>
            굵게
          </div>
        </div>

        <div css={style.clearStyle} onClick={handleClear}>
          clear
        </div>

        <div css={style.selectedColorStyle(currentColor)}></div>

        <div css={style.colorGridStyle}>
          {COLOR_LIST.map((color, idx) => (
            <div css={style.colorStyle(color)} onClick={() => handleSelectColor(color)} key={idx}></div>
          ))}
        </div>
      </div>
    </div>
  );
}
