const queue : Array<Function> = [];
let isFlushing = false
const resolvPromise = Promise.resolve()

function queueJob(job : Function) {
    if(queue.includes(job)) {
        return
    }
    queue.push(job)
    if(isFlushing) {
        return
    }
    isFlushing = true
    resolvPromise.then(() => {
        let copyQueue = queue.slice(0)
        for (let index = 0; index < copyQueue.length; index++) {
            const job = copyQueue[index];
            job()
        }
        queue.length = 0
        copyQueue.length = 0
        isFlushing = false
    })
}

export {
    queueJob
}