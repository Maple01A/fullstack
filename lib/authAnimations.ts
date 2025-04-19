// アニメーション設定
export const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            ease: "easeOut",
            staggerChildren: 0.1
        }
    },
    success: {
        scale: [1, 1.02, 1],
        boxShadow: ["0px 0px 0px rgba(0,0,0,0)", "0px 0px 30px rgba(0,255,0,0.3)", "0px 0px 0px rgba(0,0,0,0)"],
        transition: {
            duration: 0.5
        }
    }
};

export const inputVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (custom: number) => ({
        opacity: 1,
        x: 0,
        transition: {
            delay: custom * 0.1,
            duration: 0.5
        }
    })
};

export const buttonVariants = {
    idle: { scale: 1 },
    hover: { scale: 1.05 },
    tap: { scale: 0.95 }
};

export const messageVariants = {
    hidden: { opacity: 0, height: 0, marginTop: 0, marginBottom: 0 },
    visible: {
        opacity: 1,
        height: 'auto',
        marginTop: 12,
        marginBottom: 12,
        transition: { duration: 0.3 }
    },
    exit: {
        opacity: 0,
        height: 0,
        marginTop: 0,
        marginBottom: 0,
        transition: { duration: 0.2 }
    }
};
