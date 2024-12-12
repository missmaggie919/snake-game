import React, { useRef, useEffect, useState } from 'react';
import { Position, Direction } from '../types/game';

const CANVAS_SIZE = 400;
const GRID_SIZE = 20;
const SNAKE_COLOR = '#4CAF50';
const FOOD_COLOR = '#e74c3c';
const BASE_SPEED = 150;
const SPEED_INCREMENT = 10;
const MAX_SPEED = 50;

// 音效链接
const EAT_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2874/2874-preview.mp3';
const eatSound = new Audio(EAT_SOUND_URL);

// 检查位置是否有效
const isValidPosition = (position: Position): boolean => {
    return position.x >= 0 && 
           position.x < CANVAS_SIZE / GRID_SIZE && 
           position.y >= 0 && 
           position.y < CANVAS_SIZE / GRID_SIZE;
};

// 检查是否与自身碰撞
const checkCollision = (head: Position, body: Position[]): boolean => {
    return body.some((segment, index) => {
        if (index === 0) return false;
        return segment.x === head.x && segment.y === head.y;
    });
};

const GameBoard: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [snake, setSnake] = useState<Position[]>([
        { x: 5, y: 5 },
        { x: 4, y: 5 },
        { x: 3, y: 5 },
    ]);
    const [direction, setDirection] = useState<Direction>(Direction.Right);
    const [gameStarted, setGameStarted] = useState<boolean>(false);
    const [food, setFood] = useState<Position>({ x: 15, y: 15 });
    const [score, setScore] = useState<number>(0);
    const [speed, setSpeed] = useState<number>(BASE_SPEED);
    const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true);

    // 生成随机食物位置
    const generateFood = (): Position => {
        const newFood = {
            x: Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE)),
            y: Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE))
        };
        return newFood;
    };

    // 重置游戏
    const resetGame = () => {
        setSnake([
            { x: 5, y: 5 },
            { x: 4, y: 5 },
            { x: 3, y: 5 },
        ]);
        setDirection(Direction.Right);
        setGameStarted(false);
        setScore(0);
        setSpeed(BASE_SPEED);
        setFood(generateFood());
    };

    // 处理键盘事件
    const handleKeyPress = (event: KeyboardEvent) => {
        if (!gameStarted) {
            resetGame();
            setGameStarted(true);
            return;
        }
        
        switch (event.key) {
            case 'ArrowUp':
                if (direction !== Direction.Down) {
                    setDirection(Direction.Up);
                }
                break;
            case 'ArrowDown':
                if (direction !== Direction.Up) {
                    setDirection(Direction.Down);
                }
                break;
            case 'ArrowLeft':
                if (direction !== Direction.Right) {
                    setDirection(Direction.Left);
                }
                break;
            case 'ArrowRight':
                if (direction !== Direction.Left) {
                    setDirection(Direction.Right);
                }
                break;
        }
    };

    // 移动蛇
    const moveSnake = () => {
        setSnake(prevSnake => {
            const newSnake = [...prevSnake];
            const head = { ...newSnake[0] };

            switch (direction) {
                case Direction.Up:
                    head.y -= 1;
                    break;
                case Direction.Down:
                    head.y += 1;
                    break;
                case Direction.Left:
                    head.x -= 1;
                    break;
                case Direction.Right:
                    head.x += 1;
                    break;
            }

            if (!isValidPosition(head) || checkCollision(head, newSnake)) {
                setGameStarted(false);
                return prevSnake;
            }

            if (head.x === food.x && head.y === food.y) {
                // 播放音效
                if (isSoundEnabled) {
                    eatSound.currentTime = 0;
                    eatSound.play().catch(error => console.log('音效播放失败:', error));
                }
                setScore(prev => {
                    const newScore = prev + 1;
                    if (newScore % 5 === 0) {
                        const newSpeed = Math.max(BASE_SPEED - Math.floor(newScore / 5) * SPEED_INCREMENT, MAX_SPEED);
                        setSpeed(newSpeed);
                    }
                    return newScore;
                });
                setFood(generateFood());
                newSnake.unshift(head);
                return newSnake;
            }

            newSnake.unshift(head);
            newSnake.pop();
            return newSnake;
        });
    };

    // 绘制蛇
    const drawSnake = (ctx: CanvasRenderingContext2D) => {
        snake.forEach((segment) => {
            ctx.fillStyle = SNAKE_COLOR;
            ctx.fillRect(
                segment.x * GRID_SIZE,
                segment.y * GRID_SIZE,
                GRID_SIZE - 2,
                GRID_SIZE - 2
            );
        });
    };

    // 绘制食物
    const drawFood = (ctx: CanvasRenderingContext2D) => {
        ctx.fillStyle = FOOD_COLOR;
        ctx.fillRect(
            food.x * GRID_SIZE,
            food.y * GRID_SIZE,
            GRID_SIZE - 2,
            GRID_SIZE - 2
        );
    };

    // 设置键盘监听
    useEffect(() => {
        window.addEventListener('keydown', handleKeyPress);
        return () => {
            window.removeEventListener('keydown', handleKeyPress);
        };
    }, [direction, gameStarted]);

    // 设置游戏循环
    useEffect(() => {
        if (!gameStarted) return;

        const gameLoop = setInterval(moveSnake, speed);
        return () => clearInterval(gameLoop);
    }, [gameStarted, direction, speed]);

    // 渲染画布
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        ctx.strokeStyle = '#333333';
        for (let i = 0; i <= CANVAS_SIZE; i += GRID_SIZE) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, CANVAS_SIZE);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(CANVAS_SIZE, i);
            ctx.stroke();
        }

        drawSnake(ctx);
        drawFood(ctx);
    }, [snake, food]);

    return (
        <div>
            <div style={{ textAlign: 'center', marginBottom: '10px', color: 'white' }}>
                <div>分数: {score}</div>
                <div>速度等级: {Math.floor((BASE_SPEED - speed) / SPEED_INCREMENT + 1)}</div>
                <button 
                    onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                    style={{
                        marginTop: '5px',
                        padding: '5px 10px',
                        background: isSoundEnabled ? '#4CAF50' : '#666',
                        border: 'none',
                        borderRadius: '4px',
                        color: 'white',
                        cursor: 'pointer'
                    }}
                >
                    音效: {isSoundEnabled ? '开' : '关'}
                </button>
            </div>
            <canvas
                ref={canvasRef}
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                style={{ border: '2px solid #fff' }}
            />
            {!gameStarted && (
                <div style={{ textAlign: 'center', marginTop: '10px', color: 'white' }}>
                    {snake.length === 3 ? '按任意方向键开始游戏' : '游戏结束！按任意方向键重新开始'}
                </div>
            )}
        </div>
    );
};

export default GameBoard;