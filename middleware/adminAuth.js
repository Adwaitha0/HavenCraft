const checkSession=(req,res,next)=>{
    if(req.session.admin){
        next()
    }else{
        res.redirect('/admin/login')
    }
}
const isLogin=(req,res,next)=>{
    if(req.session.admin){
        res.redirect('/admin/admin_home')
    }else{
        next()
    }
}

module.exports={checkSession, isLogin}


