'use client'
import axios from 'axios';
import React, { useState } from 'react'
import { Button } from './ui/button';

type Props = {isPro: boolean}

const SubscriptionButton = (props: Props) => {
    const [loading, setLoading] = useState(false);
    
    const handleSubscription = async () => {
        try{
            setLoading(true);
            const response = await axios.post('/api/stripe');
            window.location.href = response.data.url;
        }catch(error){
            console.error(error);
        }finally{
            setLoading(false);
        }
    }

  return (
    <Button disabled={loading} onClick={handleSubscription}>
        {props.isPro ? "Manage Subscriptions" : "Get Pro"}
    </Button>
  )
}

export default SubscriptionButton