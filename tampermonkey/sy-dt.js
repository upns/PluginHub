// ==UserScript==
// @name         上应成本答题
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  随机答题、提取答案、正确答题
// @author       waino
// @match        https://www.learnin.com.cn/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 创建齿轮按钮
    const gearButton = document.createElement('div');
    gearButton.style.position = 'fixed';
    gearButton.style.bottom = '20px';
    gearButton.style.right = '20px';
    gearButton.style.width = '40px';
    gearButton.style.height = '40px';
    gearButton.style.borderRadius = '50%';
    gearButton.style.backgroundColor = '#007bff';
    gearButton.style.color = '#fff';
    gearButton.style.textAlign = 'center';
    gearButton.style.lineHeight = '40px';
    gearButton.style.cursor = 'pointer';
    gearButton.style.zIndex = '1000';
    gearButton.innerHTML = '⚙️';
    document.body.appendChild(gearButton);

    // 创建小按钮容器
    const buttonContainer = document.createElement('div');
    buttonContainer.style.position = 'fixed';
    buttonContainer.style.bottom = '70px';
    buttonContainer.style.right = '20px';
    buttonContainer.style.display = 'none';
    buttonContainer.style.zIndex = '1000';
    document.body.appendChild(buttonContainer);

    // 小按钮样式
    const buttonStyle = {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        backgroundColor: '#007bff',
        color: '#fff',
        textAlign: 'center',
        lineHeight: '40px',
        cursor: 'pointer',
        marginBottom: '10px'
    };

    // 添加小按钮
    function createButton(icon, tooltip) {
        const button = document.createElement('div');
        Object.assign(button.style, buttonStyle);
        button.innerHTML = icon;
        button.title = tooltip;
        return button;
    }

    // 随机答题按钮
    const randomButton = createButton('🎲', '随机答题');
    randomButton.onclick = async function() {
        // 随机选择题目答案
        const questions = document.querySelectorAll('.store-question-item-container');

        questions.forEach(question => {
            const options = question.querySelectorAll('.option-item');
            if (options.length > 0) {
                const randomIndex = Math.floor(Math.random() * options.length);
                const selectedOption = options[randomIndex];
                const optionIndex = selectedOption.querySelector('.option-index.can-do');
                if (optionIndex) {
                    optionIndex.click();
                }
            }
        });

        // 定义要点击的按钮文本
        const buttonTexts = ['提交作业', '确认提交', '确定'];

        // 逐步点击按钮的函数
        for (const text of buttonTexts) {
            try {
                await clickButtonWhenAvailable(text);
            } catch (error) {
                console.log(`未找到按钮: ${text}`);
            }
        }
    };

    // 定义一个等待并点击按钮的函数
    function clickButtonWhenAvailable(buttonText) {
        return new Promise((resolve, reject) => {
            const intervalId = setInterval(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                let button;

                if (buttonText.includes('/')) {
                    // 处理多个可能的按钮文本
                    const buttonTexts = buttonText.split('/');
                    button = buttons.find(btn =>buttonTexts.some(text =>btn.textContent.trim() === text.trim()));
                } else {
                    // 处理单个按钮文本
                    button = buttons.find(btn =>btn.textContent.trim() === buttonText);
                }

                if (button) {
                    button.click();
                    console.log(`成功点击按钮: "${button.textContent.trim()}"`);
                    clearInterval(intervalId);
                    resolve();
                }
            }, 500);

            // 设置超时时间，例如 10 秒，若超时则返回错误
            setTimeout(() => {
                clearInterval(intervalId);
                reject(new Error(`按钮 "${buttonText}" 未在限定时间内找到`));
            }, 10000);
        });
    }

    // 正确答题按钮
    const correctButton = createButton('✅', '正确答题');
    correctButton.onclick = async function() {
        try {
            // Step 1: 提取答案并保存到 localStorage
            const questions = document.querySelectorAll('.store-question-item-container');
            const answers = [];
            questions.forEach(question => {
                const answerElement = question.querySelector('.answer-content');
                if (answerElement) {
                    const answerValue = answerElement.textContent.trim();
                    const options = question.querySelectorAll('.option-item');
                    options.forEach(option => {
                        const optionIndex = option.querySelector('.option-index').textContent.trim();
                        if (optionIndex === answerValue) {
                            const optionContent = option.querySelector('.option-content > div').textContent.trim();
                            answers.push(optionContent);
                        }
                    });
                }
            });
            localStorage.setItem('answers', JSON.stringify(answers));
            console.log("答案已提取并存储：", answers);

            // Step 2: 点击相关按钮（继续答题、确认）
            await clickButtonWhenAvailable('重新答题/继续答题');
            await clickButtonWhenAvailable('确认');

            // 等待页面刷新完成
            await new Promise(resolve => setTimeout(resolve, 300));

            // Step 3: 重新获取页面元素并答题
            const updatedQuestions = document.querySelectorAll('.store-question-item-container');
            const targets = JSON.parse(localStorage.getItem('answers'));

            updatedQuestions.forEach((question, index) => {
                if (index >= targets.length) return;
                const targetAnswer = targets[index].trim();
                const options = question.querySelectorAll('.option-item');
                options.forEach(option => {
                    const optionText = option.querySelector('.option-content > div').textContent.trim();
                    if (optionText === targetAnswer) {
                        option.style.backgroundColor = 'yellow';
                        const optionIndex = option.querySelector('.option-index.can-do');
                        if (optionIndex) {
                            optionIndex.click();
                        }
                    }
                });
            });

            // 等待答题操作完成
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Step 4: 点击提交按钮
            const buttonTexts = ['提交作业', '确认提交', '确定'];

            for (const text of buttonTexts) {
                try {
                    await clickButtonWhenAvailable(text);
                } catch (error) {
                    console.log(`未找到按钮: ${text}`);
                }
            }

        } catch (error) {
            console.error("执行过程中出现错误:", error);
        }
    };

    // 添加小按钮到容器
    buttonContainer.appendChild(randomButton);
    buttonContainer.appendChild(correctButton);

    // 齿轮按钮点击事件
    gearButton.onclick = function() {
        if (buttonContainer.style.display === 'none') {
            buttonContainer.style.display = 'block';
        } else {
            buttonContainer.style.display = 'none';
        }
    };
})();
