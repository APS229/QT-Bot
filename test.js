function calc(eq) {
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
console.log(calc('160 * 7 / 1.2 + 17 - 2'));