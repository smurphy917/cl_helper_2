export const app = require("express")();

app.get('test',(err,res,next) => {
    res.json({
        'success': true
    });
});

app.listen(80,() => {
    console.log('listening on 80');
});
