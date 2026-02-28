package com.example.fastnotes_kotlin

object Routes {
    const val LIST = "list"
    const val NEW = "new"
    const val DETAILS = "details/{noteId}"

    fun details(noteId: Long) = "details/$noteId"
}