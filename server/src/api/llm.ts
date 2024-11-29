import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import app from "src/app";

const API_KEY = process.env.EVRAZ_API_KEY;
const BASE_URL = process.env.BASE_URL;

app.get