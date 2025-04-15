<?php

namespace App\Http\Controllers;

use App\Models\LoginLog;
use App\Models\User;
use Illuminate\Http\Request;

class LoginLogController extends Controller
{
    /**
     * Display a listing of login logs.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        return response()->json(LoginLog::with('user')->get());
    }

    /**
     * Display the specified login log.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        return response()->json(LoginLog::findOrFail($id));
    }

    /**
     * Get login history for a specific user
     *
     * @param  \App\Models\User  $user
     * @return \Illuminate\Http\Response
     */
    public function getUserLoginHistory(User $user)
    {
        return response()->json(
            LoginLog::where('user_id', $user->id)
                ->orderBy('login_at', 'desc')
                ->get()
        );
    }
}
