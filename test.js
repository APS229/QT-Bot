function DMAS(eq) {
    let answer = 0;
    const subValues = eq.split('-');
    for (let s = 0; s < subValues.length; s++) {
        const addValues = subValues[s].split('+');
        for (let a = 0; a < addValues.length; a++) {
            const multiValues = addValues[a].split('*');
            for (let m = 0; m < multiValues.length; m++) {
                const divValues = multiValues[m].split('/');
                answer = parseFloat(divValues[0]);
                for (let d = 1; d < divValues.length; d++) {
                    answer = answer / divValues[d];
                }
                multiValues[m] = answer;
            }
            answer = parseFloat(multiValues[0]);
            for (let m = 1; m < multiValues.length; m++) {
                answer = answer * multiValues[m];
            }
            addValues[a] = answer;
        }
        answer = parseFloat(addValues[0]);
        for (let a = 1; a < addValues.length; a++) {
            answer = answer + addValues[a];
        }
        subValues[s] = answer;
    }
    answer = parseFloat(subValues[0]);
    for (let s = 1; s < subValues.length; s++) {
        answer = answer - subValues[s];
    }
    return answer;
}
function calc(eq) {
    eq = eq.replaceAll(' ', '');
    while (eq.includes('(') || eq.includes(')')) {
        const rightBracket = eq.indexOf(')');
        let leftBracket = eq.lastIndexOf('(');
        if (rightBracket < 0) return "You're missing a right bracket.";
        if (leftBracket < 0) return "You're missing a left bracket.";
        if (rightBracket < leftBracket) {
            leftBracket = eq.lastIndexOf('(', rightBracket);
            if (rightBracket < leftBracket) return "You put the left bracket after the right bracket.";
            if (eq[rightBracket + 1] === '(') eq = eq.substring(0, rightBracket + 1) + '*' + eq.substring(rightBracket + 1, eq.length);
        }
        const solved = DMAS(eq.substring(leftBracket + 1, rightBracket));
        if (isNaN(solved)) return "Invalid equation.";
        eq = eq.substring(0, leftBracket) + solved + eq.substring(rightBracket + 1, eq.length);
    }
    return DMAS(eq);
}
console.log(calc('(((1 + 0)))* ((1 + 0)) /((1 + 0))+1-1'));